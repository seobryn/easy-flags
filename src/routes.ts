import express from "express";
import fs from "fs";
import path from "path";
import { authMiddleware } from "./authMiddlewares";
import stripe from "./stripeClient";
import stripeRoutes from "./routes/stripeRoutes";
import createEnvironmentRouter from "./routes/environmentRoutes";
import createFeatureRouter from "./routes/featureRoutes";
import createFlagRouter from "./routes/flagRoutes";
import createRoleRouter from "./routes/roleRoutes";
import createPermissionRouter from "./routes/permissionRoutes";
import createUserRouter from "./routes/userRoutes";
import createSpaceRouter from "./routes/spaceRoutes";
import { EnvironmentRepository } from "./infrastructure/repositories/environmentRepository";
import { FeatureRepository } from "./infrastructure/repositories/featureRepository";
import { FeatureValueRepository } from "./infrastructure/repositories/featureValueRepository";
import { RoleRepository } from "./infrastructure/repositories/roleRepository";
import { PermissionRepository } from "./infrastructure/repositories/permissionRepository";
import { EnvironmentService } from "./application/services/environmentService";
import { FeatureService } from "./application/services/featureService";
import { FlagQueryService } from "./application/services/flagQueryService";
import { RoleService } from "./application/services/roleService";
import { PermissionService } from "./application/services/permissionService";
import { UserRepository } from "./infrastructure/repositories/userRepository";
import { UserService } from "./application/services/userService";

const router = express.Router();

const environmentRepository = new EnvironmentRepository();
const featureRepository = new FeatureRepository();
const featureValueRepository = new FeatureValueRepository();
const roleRepository = new RoleRepository();
const permissionRepository = new PermissionRepository();

const environmentService = new EnvironmentService(
  environmentRepository,
  featureRepository,
  featureValueRepository,
);
const featureService = new FeatureService(
  featureRepository,
  featureValueRepository,
);
const flagQueryService = new FlagQueryService(
  environmentRepository,
  featureRepository,
  featureValueRepository,
);
const roleService = new RoleService(roleRepository, permissionRepository);
const permissionService = new PermissionService(permissionRepository);
const userRepository = new UserRepository();
const userService = new UserService(userRepository);

const openApiSpec = JSON.parse(
  fs.readFileSync(
    path.resolve(process.cwd(), "src/docs/openapi.json"),
    "utf-8",
  ),
);

// Public OpenAPI JSON for Swagger UI
router.get("/openapi.json", (req, res) => {
  res.json(openApiSpec);
});

// Mount public stripe routes (webhook, prices)
router.use("/stripe", stripeRoutes);

// Protect all remaining routes with authentication
router.use(authMiddleware);

// Protected stripe action: create checkout session
router.post("/stripe/create-checkout-session", async (req, res) => {
  const user = (req as any).user;
  const priceId = req.body?.priceId || process.env.STRIPE_DEFAULT_PRICE_ID;
  if (!priceId) return res.status(400).json({ error: "priceId required" });

  try {
    const customer = await stripe.customers.create({
      metadata: { userId: String(user.id), username: String(user.username) },
    });

    const successUrl =
      process.env.STRIPE_SUCCESS_URL ||
      `${process.env.APP_ORIGIN || "http://localhost:3000"}/environments`;
    const cancelUrl =
      process.env.STRIPE_CANCEL_URL ||
      `${process.env.APP_ORIGIN || "http://localhost:3000"}/environments`;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer: customer.id,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { userId: String(user.id) },
    });

    res.json({ url: session.url, id: session.id });
  } catch (err: any) {
    console.error("Failed to create checkout session:", err?.message || err);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

// Mount protected domain routers
router.use("/spaces", createSpaceRouter());
router.use("/environments", createEnvironmentRouter(environmentService));
router.use("/features", createFeatureRouter(featureService));
router.use(
  "/flags",
  createFlagRouter(environmentService, featureService, flagQueryService),
);
router.use("/users", createUserRouter(userService));
router.use("/roles", createRoleRouter(roleService, permissionService));
router.use("/permissions", createPermissionRouter(permissionService));

export default router;
