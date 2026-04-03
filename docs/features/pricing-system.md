# Pricing System Documentation

## Overview

The pricing system allows you to manage subscription plans, assign them to spaces (workspaces), and track pricing limits for each tier.

## Database Tables

### 1. `pricing_plans`

Stores the main pricing tiers.

**Fields:**

- `id` - Primary key
- `slug` - Unique identifier (e.g., "lab", "basic", "pro")
- `name` - Display name (e.g., "Lab", "Basic", "Pro")
- `description` - Plan description
- `price` - Monthly/yearly price in dollars
- `billing_period` - "monthly", "yearly", or "one-time"
- `is_active` - Whether the plan is currently available
- `is_recommended` - Whether to highlight this plan (e.g., show a "Recommended" badge)
- `sort_order` - Display order in the pricing table (1, 2, 3, etc.)
- `stripe_price_id` - Integration with Stripe (optional)
- `created_at` - Timestamp
- `updated_at` - Timestamp

**Indexes:**

- `sort_order, is_active` - For efficient filtering and sorting

### 2. `pricing_plan_features`

Lists features included in each plan.

**Fields:**

- `id` - Primary key
- `pricing_plan_id` - Foreign key to pricing_plans
- `feature_name` - Feature description (e.g., "Up to 50 feature flags")
- `feature_description` - Additional details
- `feature_value` - Numeric or string value
- `sort_order` - Order features appear (1, 2, 3, etc.)
- `created_at` - Timestamp

**Indexes:**

- `pricing_plan_id, sort_order` - For efficient feature retrieval

### 3. `pricing_plan_limits`

Defines limits for each plan (flags, environments, API requests, etc.).

**Fields:**

- `id` - Primary key
- `pricing_plan_id` - Foreign key to pricing_plans
- `limit_name` - Type of limit (e.g., "max_flags", "max_environments", "api_requests_per_month")
- `limit_value` - The limit (use -1 for unlimited)
- `limit_description` - Human-readable description
- `created_at` - Timestamp
- `updated_at` - Timestamp

**Unique constraint:** `pricing_plan_id, limit_name`

**Indexes:**

- `pricing_plan_id` - For efficient limit retrieval

### 4. `space_subscriptions`

Tracks which space (workspace) is subscribed to which plan.

**Fields:**

- `id` - Primary key
- `space_id` - Foreign key to spaces (unique - one subscription per space)
- `pricing_plan_id` - Foreign key to pricing_plans
- `status` - "active", "canceled", "past_due", "trial"
- `stripe_subscription_id` - Stripe integration
- `trial_start_date` - Trial period start
- `trial_end_date` - Trial period end
- `current_period_start` - Billing period start
- `current_period_end` - Billing period end
- `cancellation_date` - When cancellation was requested
- `canceled_at` - When it was actually canceled
- `created_at` - Timestamp
- `updated_at` - Timestamp

**Indexes:**

- `space_id` (unique)
- `pricing_plan_id`
- `status`

## API Endpoints

### 1. Get All Pricing Plans

```
GET /api/pricing
```

Returns all active pricing plans with their features and limits.

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "slug": "lab",
      "name": "Lab",
      "description": "Perfect for testing and learning",
      "price": 0,
      "billing_period": "monthly",
      "is_active": true,
      "is_recommended": false,
      "sort_order": 1,
      "created_at": "2026-03-21T...",
      "updated_at": "2026-03-21T...",
      "features": [
        {
          "id": 1,
          "pricing_plan_id": 1,
          "feature_name": "Up to 5 feature flags",
          "feature_description": null,
          "feature_value": null,
          "sort_order": 1,
          "created_at": "2026-03-21T..."
        }
      ],
      "limits": [
        {
          "id": 1,
          "pricing_plan_id": 1,
          "limit_name": "max_flags",
          "limit_value": 5,
          "limit_description": "Maximum number of feature flags",
          "created_at": "2026-03-21T...",
          "updated_at": "2026-03-21T..."
        }
      ]
    }
  ]
}
```

### 2. Get Pricing Plan by Slug

```
GET /api/pricing/[slug]
```

Get a specific plan (e.g., `/api/pricing/basic`).

**Response:** Single plan object with features and limits.

### 3. Initialize Default Pricing Plans

```
POST /api/pricing
```

Creates default plans: Lab (free), Basic ($9.99), and Pro ($29.99).

**Response:**

```json
{
  "success": true,
  "data": {
    "message": "Pricing plans initialized",
    "plans": [...]
  }
}
```

### 4. Get Space Subscription

```
GET /api/pricing/subscriptions/[spaceId]
```

Get the current subscription for a space.

**Response:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "space_id": 123,
    "pricing_plan_id": 2,
    "status": "active",
    "stripe_subscription_id": null,
    "trial_start_date": null,
    "trial_end_date": null,
    "current_period_start": null,
    "current_period_end": null,
    "created_at": "2026-03-21T...",
    "updated_at": "2026-03-21T...",
    "pricing_plan": {
      "id": 2,
      "slug": "basic",
      "name": "Basic",
      "price": 9.99,
      ...
    }
  }
}
```

### 5. Assign Plan to Space

```
POST /api/pricing/subscriptions/[spaceId]
```

Assign a pricing plan to a space (requires authentication).

**Request body:**

```json
{
  "planSlug": "basic"
}
```

**Response:** Updated subscription object.

## Service Layer

The `PricingService` class provides high-level operations:

### Key Methods:

```typescript
// Initialize default pricing plans
await pricingService.initializeDefaultPricing();

// Get all active plans with details
const plans = await pricingService.getAllPricingPlans();

// Get a plan by slug
const plan = await pricingService.getPricingPlanBySlug("basic");

// Create a new plan
const newPlan = await pricingService.createPricingPlan(
  { slug: "enterprise", name: "Enterprise", price: 99.99, ... },
  [{ feature_name: "Custom feature", ... }],
  [{ limit_name: "max_flags", limit_value: -1, ... }]
);

// Update a plan
await pricingService.updatePricingPlan(planId, { price: 14.99, ... });

// Reorder plans for display
await pricingService.reorderPricingPlans([1, 2, 3]);

// Assign plan to space
await pricingService.assignPlanToSpace(spaceId, "basic");

// Get space subscription
const subscription = await pricingService.getSpaceSubscription(spaceId);

// Get a specific limit for a space
const maxFlags = await pricingService.getSpaceLimit(spaceId, "max_flags");
```

## Default Plans

The system comes with three pre-configured plans:

### Lab (Free)

- Price: $0/month
- Recommended: No
- Sort Order: 1
- Features:
  - Up to 5 feature flags
  - 1 environment
  - Basic analytics
  - Community support
- Limits:
  - `max_flags`: 5
  - `max_environments`: 1
  - `api_requests_per_month`: 1,000

### Basic

- Price: $9.99/month
- Recommended: Yes ⭐
- Sort Order: 2
- Features:
  - Up to 50 feature flags
  - 3 environments
  - Advanced analytics
  - Email support
  - API access
- Limits:
  - `max_flags`: 50
  - `max_environments`: 3
  - `api_requests_per_month`: 100,000

### Pro

- Price: $29.99/month
- Recommended: No
- Sort Order: 3
- Features:
  - Unlimited flags
  - Unlimited environments
  - Advanced analytics
  - Priority support
  - Advanced API
  - Team collaboration
- Limits:
  - `max_flags`: -1 (unlimited)
  - `max_environments`: -1 (unlimited)
  - `api_requests_per_month`: 1,000,000

## Usage Examples

### Frontend - Display Pricing Plans

```astro
---
import { PricingService } from "@application/services/pricing.service";

const pricingService = PricingService.getInstance();
const plans = await pricingService.getAllPricingPlans();
---

<div class="pricing-grid">
  {plans.map(plan => (
    <div class="plan-card" class:list={{ recommended: plan.is_recommended }}>
      <h3>{plan.name}</h3>
      <p class="price">${plan.price}/{plan.billing_period}</p>
      <ul>
        {plan.features?.map(feature => (
          <li>{feature.feature_name}</li>
        ))}
      </ul>
    </div>
  ))}
</div>
```

### Check Space Limits

```typescript
const pricingService = PricingService.getInstance();

// Check if space can create more flags
const maxFlags = await pricingService.getSpaceLimit(spaceId, "max_flags");
const currentFlags = await getSpaceFeatureFlagCount(spaceId);

if (maxFlags !== -1 && currentFlags >= maxFlags) {
  throw new Error("Flag limit reached. Upgrade your plan.");
}
```

### Assign Plan on Space Creation

```typescript
// When creating a new space, assign a default plan
const newSpace = await spaceService.createSpace(userId, { name: "My Space" });
await pricingService.assignPlanToSpace(newSpace.id, "lab"); // Default to free plan
```

## Migration

The migration file `005_add_pricing_tables.sql` automatically creates all the necessary tables.

To run migrations manually:

```bash
npm run migrate  # or pnpm migrate
```

## Next Steps

1. **Initialize the pricing plans:**

   ```
   POST /api/pricing
   ```

2. **Update the billing page component** to use the new API:

   ```astro
   import { PricingService } from "@application/services/pricing.service";
   ```

3. **Add plan enforcement** - Check limits before operations:
   - Creating feature flags
   - Creating environments
   - API calls

4. **Integrate with Stripe** (optional):
   - Add Stripe webhook handlers
   - Update `stripe_price_id` and `stripe_subscription_id` fields
   - Handle subscription status updates

5. **Add admin panel** for managing pricing plans:
   - Create plans
   - Update sort order
   - Manage features and limits

## Sorting Feature

All pricing tables support sorting via the `sort_order` field:

- **Pricing Plans**: Displayed in order of `sort_order`
- **Plan Features**: Listed in order of `sort_order` (important for UI display)
- **Plan Limits**: Can be retrieved in order for consistency

The `updateSortOrder` methods allow bulk reordering:

```typescript
// Reorder plans by IDs
await pricingService.reorderPricingPlans([3, 1, 2]); // Pro, Lab, Basic

// Reorder features within a plan
const featureRepo = registry.getPricingPlanFeatureRepository();
await featureRepo.updateSortOrder([
  { id: 5, sort_order: 1 },
  { id: 3, sort_order: 2 },
  { id: 7, sort_order: 3 },
]);
```

This ensures the pricing table displays in your desired order consistently.
