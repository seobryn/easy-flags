import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";

dotenv.config();

import routes from "./routes";
import { signToken, verifyToken } from "./authMiddlewares";
import { pageAuthMiddleware } from "./pageMiddlewares";
import { UserRepository } from "./infrastructure/repositories/userRepository";
import { AuthService } from "./application/services/authService";

const PORT = Number(process.env.PORT || 3000);

const userRepository = new UserRepository();
const authService = new AuthService(userRepository);

const app = express();
app.use(cors());
// Use raw body parser for Stripe webhooks on the webhook path, then JSON for others
app.use("/api/stripe/webhook", express.raw({ type: "application/json" }));
app.use(express.json());
app.use(cookieParser());

// Expose `user` to EJS templates when a valid auth cookie is present
app.use((req, res, next) => {
  const token = (req.cookies as any)?.ff_token;
  if (token) {
    try {
      // verifyToken returns the decoded payload
      (res as any).locals.user = verifyToken(token);
    } catch (err) {
      // invalid token - ignore and continue without user
    }
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

    app.post("/auth/login", async (req, res) => {
      const { username, password } = req.body;
      if (!username || !password)
        return res
          .status(400)
          .json({ error: "Username and Password required" });
      const user = await authService.authenticate(username, password);
      if (!user) return res.status(401).json({ error: "Invalid credentials" });
      const token = signToken({ username: user.username, id: user.id });
      // Set secure httpOnly cookie
      res.cookie("ff_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 8 * 60 * 60 * 1000, // 8 hours
      });
      res.json({ token });
    });

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

    app.get("/docs", pageAuthMiddleware, (req, res) => {
      res.render("layout", {
        title: "API Documentation | Feature Flags",
        pageView: "docs",
      });
    });

    // API routes with authentication
    app.use("/api", routes);
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize DB", err);
    process.exit(1);
  });
