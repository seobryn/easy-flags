import express from "express";
import fs from "fs";
import path from "path";
import { authMiddleware } from "./authMiddlewares";
import stripe from "./stripeClient";
import { SubscriptionRepository } from "./infrastructure/repositories/subscriptionRepository";
import { EnvironmentRepository } from "./infrastructure/repositories/environmentRepository";
import { FeatureRepository } from "./infrastructure/repositories/featureRepository";
import { FeatureValueRepository } from "./infrastructure/repositories/featureValueRepository";
import { EnvironmentService } from "./application/services/environmentService";
import { FeatureService } from "./application/services/featureService";
import { FlagQueryService } from "./application/services/flagQueryService";
import stripeRoutes from "./routes/stripeRoutes";
import createEnvironmentRouter from "./routes/environmentRoutes";
import createFeatureRouter from "./routes/featureRoutes";
import createFlagRouter from "./routes/flagRoutes";
import { UserRepository } from "./infrastructure/repositories/userRepository";
import { UserService } from "./application/services/userService";
import createUserRouter from "./routes/userRoutes";

const router = express.Router();

const environmentRepository = new EnvironmentRepository();
const featureRepository = new FeatureRepository();
const featureValueRepository = new FeatureValueRepository();

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
router.use("/environments", createEnvironmentRouter(environmentService));
router.use("/features", createFeatureRouter(featureService));
router.use(
  "/flags",
  createFlagRouter(environmentService, featureService, flagQueryService),
);
router.use("/users", createUserRouter(userService));

// Environments
router.get("/environments", async (req, res) => {
  const rows = await environmentService.listEnvironments();
  res.json(rows);
});

router.post("/environments", async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "name required" });
  try {
    const env = await environmentService.createEnvironment(name);
    res.status(201).json(env);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete("/environments/:id", async (req, res) => {
  const id = Number(req.params.id);
  try {
    const deleted = await environmentService.deleteEnvironment(id);
    if (deleted) return res.json({ success: true });
    return res.status(404).json({ error: "Environment not found" });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.put("/environments/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "name required" });
  try {
    const env = await environmentService.updateEnvironmentName(id, name);
    if (env) return res.json(env);
    return res.status(404).json({ error: "Environment not found" });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Features
router.get("/features", async (req, res) => {
  const rows = await featureService.listFeatures();
  res.json(rows);
});

router.post("/features", async (req, res) => {
  const { key, description } = req.body;
  if (!key) return res.status(400).json({ error: "key required" });
  if (/\s/.test(key)) {
    return res.status(400).json({ error: "key cannot contain spaces" });
  }
  try {
    const feature = await featureService.createFeature(key, description);
    res.status(201).json(feature);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete("/features/:id", async (req, res) => {
  const id = Number(req.params.id);
  try {
    const deleted = await featureService.deleteFeature(id);
    if (deleted) return res.json({ success: true });
    return res.status(404).json({ error: "Feature not found" });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.put("/features/:id/value", async (req, res) => {
  const featureId = Number(req.params.id);
  const { environmentId, value } = req.body;
  if (!environmentId || typeof value !== "boolean") {
    return res
      .status(400)
      .json({ error: "environmentId and boolean value required" });
  }
  try {
    const fv = await featureService.setFeatureValue(
      featureId,
      environmentId,
      value,
    );
    res.json(fv);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get("/flags", async (req, res) => {
  const env = req.query.env as string | undefined;
  if (!env) {
    return res
      .status(400)
      .json({ error: "env query parameter required (name)" });
  }

  const flags = await flagQueryService.getFlagsByEnvironmentName(env);
  if (!flags) {
    return res.status(404).json({ error: "environment not found" });
  }

  res.json(flags);
});

router.get("/flags/:env/:key", async (req, res) => {
  const envName = req.params.env as string | undefined;
  const key = req.params.key as string | undefined;

  if (!envName || !key) {
    return res
      .status(400)
      .json({ error: "env and key path parameters required" });
  }

  const environment = await environmentService.findByName(envName);
  if (!environment) {
    return res.status(404).json({ error: "environment not found" });
  }

  const feature = await featureService.findByKey(key);
  if (!feature) {
    return res.status(404).json({ error: "feature not found" });
  }

  const result = await flagQueryService.isFeatureEnabled(envName, key);
  if (!result) {
    return res.status(404).json({ error: "feature value not found" });
  }

  res.json(result);
});

export default router;
