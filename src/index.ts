import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { Request, Response, NextFunction } from "express";
import { JwtPayload } from "jsonwebtoken";

dotenv.config();

import routes from "./routes";
import { signToken, verifyToken } from "./authMiddlewares";
import { pageAuthMiddleware } from "./pageMiddlewares";
import { UserRepository } from "./infrastructure/repositories/userRepository";
import { AuthService } from "./application/services/authService";
import { UserService } from "./application/services/userService";
import { PermissionRepository } from "./infrastructure/repositories/permissionRepository";
import { errorHandler, asyncHandler } from "./utils/errorHandler";
import { validateUserInput } from "./utils/validators";
import { HTTP_STATUS, ERROR_MESSAGES } from "./utils/constants";

const PORT = Number(process.env.PORT || 3000);

// Singleton instances
const userRepository = new UserRepository();
const permissionRepository = new PermissionRepository();
const userService = new UserService(userRepository);
const authService = new AuthService(userRepository);

const app = express();
app.use(cors());
// Use raw body parser for Stripe webhooks on the webhook path, then JSON for others
app.use("/api/stripe/webhook", express.raw({ type: "application/json" }));
app.use(express.json());
app.use(cookieParser());

// Expose `user` and their permissions to EJS templates when a valid auth cookie is present
app.use(async (req, res, next) => {
  const token = (req.cookies as any)?.ff_token;
  if (token) {
    try {
      // verifyToken returns the decoded payload
      const user = verifyToken(token) as JwtPayload;
      (res as any).locals.user = user;
      // Fetch permissions for the user's role
      if (user && user.id) {
        const userRecord = await userRepository.findById(user.id);
        if (userRecord && userRecord.role_id) {
          const perms = await permissionRepository.getRolePermissions(
            userRecord.role_id,
          );
          (res as any).locals.permissions = perms.map((p: any) => p.name);
        } else {
          (res as any).locals.permissions = [];
        }
      }
    } catch (err) {
      // invalid token - ignore and continue without user
    }
  } else {
    (res as any).locals.permissions = [];
  }
  next();
});

// Set view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "..", "views"));

// Static assets
app.use(express.static(path.join(__dirname, "..", "public")));

// Ensure admin user exists from env
async function ensureAdmin() {
  const adminUser = process.env.ADMIN_USER || "admin";
  const adminPass = process.env.ADMIN_PASS || "password";
  await authService.ensureAdminUser(adminUser, adminPass);
}

// Ensure DB and admin then start server
ensureAdmin()
  .then(() => {
    // Landing page (public)
    app.get("/", (req, res) => {
      res.render("index");
    });

    // Login page (public)
    app.get("/login", (req, res) => {
      const token = req.cookies.ff_token;
      if (token) {
        try {
          verifyToken(token);
          return res.redirect("/environments");
        } catch (err) {
          // Invalid cookie token, show login page
        }
      }

      res.render("login");
    });

    app.get("/create-account", (req, res) => {
      res.render("create-account");
    });

    app.post(
      "/auth/register",
      validateUserInput,
      asyncHandler(async (req, res) => {
        const { username, password } = req.body;
        try {
          await userService.createUser(username, password);
          // Optionally, auto-login after registration
          // const token = signToken({ username, id: user.id });
          // res.cookie("ff_token", token, { httpOnly: true, ... });
          return res.redirect("/login");
        } catch (err) {
          let errorMsg = ERROR_MESSAGES.REGISTRATION_FAILED;
          if (err instanceof Error) errorMsg = err.message;
          return res
            .status(HTTP_STATUS.BAD_REQUEST)
            .render("create-account", { error: errorMsg });
        }
      }),
    );

    app.post(
      "/auth/login",
      validateUserInput,
      asyncHandler(async (req, res) => {
        const { username, password } = req.body;
        const user = await authService.authenticate(username, password);
        if (!user)
          return res
            .status(HTTP_STATUS.UNAUTHORIZED)
            .json({ error: ERROR_MESSAGES.INVALID_CREDENTIALS });
        const token = signToken({ username: user.username, id: user.id });
        // Set secure httpOnly cookie
        res.cookie("ff_token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 8 * 60 * 60 * 1000, // 8 hours
        });
        res.json({ token });
      }),
    );

    // Add logout endpoint to clear cookie
    app.post("/auth/logout", (req, res) => {
      res.clearCookie("ff_token");
      res.json({ success: true });
    });

    app.get("/billing", (req, res) => {
      res.render("layout", {
        title: "Billing | Feature Flags",
        pageView: "billing",
      });
    });

    // API Reference page (public)
    app.get("/api-reference", (req, res) => {
      res.render("layout", {
        title: "API Reference | Feature Flags",
        pageView: "api-reference",
      });
    });

    // Privacy page (public)
    app.get("/privacy", (req, res) => {
      res.render("privacy", { title: "Privacy Policy | Easy Flags" });
    });

    // Terms page (public)
    app.get("/terms", (req, res) => {
      res.render("terms", { title: "Terms of Service | Easy Flags" });
    });

    // Contact page (public)
    app.get("/contact", (req, res) => {
      res.render("contact", { title: "Contact Us | Easy Flags" });
    });

    // Protected page routes
    app.get("/environments", pageAuthMiddleware, (req, res) => {
      res.render("layout", {
        title: "Environments | Feature Flags",
        pageView: "envs",
      });
    });

    app.get("/features", pageAuthMiddleware, (req, res) => {
      res.render("layout", {
        title: "Features | Feature Flags",
        pageView: "features",
      });
    });

    app.get("/users", pageAuthMiddleware, (req, res) => {
      res.render("layout", {
        title: "Users | Feature Flags",
        pageView: "users",
      });
    });

    app.get("/roles", pageAuthMiddleware, (req, res) => {
      res.render("layout", {
        title: "Roles | Feature Flags",
        pageView: "roles",
      });
    });

    app.get("/docs", pageAuthMiddleware, (req, res) => {
      res.render("layout", {
        title: "API Documentation | Feature Flags",
        pageView: "docs",
      });
    });

    // API routes with authentication
    app.use("/api", routes);

    // Error handler for forbidden (403) on page routes
    app.use((err: any, req: Request, res: Response, next: NextFunction) => {
      if (err && err.status === HTTP_STATUS.FORBIDDEN) {
        return res
          .status(HTTP_STATUS.FORBIDDEN)
          .render("forbidden", { title: "Forbidden" });
      }
      next(err);
    });

    // Centralized error handler (must be last)
    app.use(errorHandler);

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize DB", err);
    process.exit(1);
  });
