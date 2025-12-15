# Services Layer

This directory contains the **business logic** layer of the application.

## Architecture Pattern: Controller → Service → Model

```
┌─────────────┐
│  Controller │  ← Handles HTTP (requests, responses, status codes)
└──────┬──────┘
       │
       ↓
┌─────────────┐
│   Service   │  ← Contains business logic (calculations, validation, orchestration)
└──────┬──────┘
       │
       ↓
┌─────────────┐
│    Model    │  ← Database operations (MongoDB/Mongoose)
└─────────────┘
```

## Why Separate Services from Controllers?

### Controllers Should Be Thin
Controllers handle HTTP concerns only:
- Parse request parameters
- Call service methods
- Format responses
- Return appropriate status codes

### Services Contain Business Logic
Services handle domain logic:
- Calculations and algorithms
- Business rules and validation
- Orchestrating multiple operations
- Transaction management

### Benefits

1. **Testability**: Services can be tested without HTTP mocks
2. **Reusability**: Services can be called from controllers, cron jobs, CLI, etc.
3. **Maintainability**: Business logic is centralized and easier to modify
4. **Separation of Concerns**: Each layer has a clear responsibility

## Example: Upgrade Service

### Before (Controller with Business Logic) ❌

```typescript
export async function purchaseUpgrade(req, res) {
  const user = req.user;
  const { type } = req.params;

  // Business logic mixed with HTTP handling
  const cost = BASE_COSTS[type] * Math.pow(MULTIPLIERS[type], user.upgrades[type]);

  if (user.coins < cost) {
    return res.status(400).json({ error: 'Insufficient coins' });
  }

  user.coins -= cost;
  user.upgrades[type]++;
  await user.save();

  // More business logic...
  const power = calculatePower(type, user.upgrades[type]);

  res.json({ success: true, data: { power } });
}
```

### After (Clean Separation) ✅

**Controller** (thin, HTTP-focused):
```typescript
export async function purchaseUpgrade(req: AuthRequest, res: Response) {
  try {
    const user = req.user;
    if (!user) return ApiRes.unauthorized(res);

    const { type } = req.params as { type: keyof IUpgrades };

    const data = await upgradeService.purchaseUpgrade(user, type);

    return res.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed';
    return ApiRes.badRequest(res, message);
  }
}
```

**Service** (business logic):
```typescript
async purchaseUpgrade(user: IUser, type: keyof IUpgrades) {
  // Validation
  const validation = this.canPurchaseUpgrade(user, type);
  if (!validation.canPurchase) {
    throw new Error(validation.reason);
  }

  // Business logic
  const cost = this.calculateCost(type, user.upgrades[type]);
  user.coins -= cost;
  user.upgrades[type]++;

  await user.save();

  // Return calculated data
  return {
    upgrade: { /* ... */ },
    balance: user.coins,
    powerLevel: user.getPowerLevel()
  };
}
```

## File Structure

```
src/
├── config/
│   └── upgrade.config.ts        # Configuration (costs, multipliers)
├── types/
│   └── upgrade.types.ts         # TypeScript interfaces
├── services/
│   └── upgrade.service.ts       # Business logic
└── controllers/
    └── upgradeController.ts     # HTTP handling
```

## Testing Benefits

With services, you can write **pure unit tests**:

```typescript
describe('UpgradeService', () => {
  it('should calculate cost correctly', () => {
    const cost = upgradeService.calculateCost('speed', 5);
    expect(cost).toBe(12); // Easy to test!
  });

  it('should reject purchase with insufficient funds', async () => {
    const user = createMockUser({ coins: 100 });

    await expect(
      upgradeService.purchaseUpgrade(user, 'addWarrior')
    ).rejects.toThrow('Insufficient coins');
  });
});
```

No HTTP mocks, no Express setup, no complexity!

## Guidelines

### Do's ✅
- Put business logic in services
- Make services class-based or function-based (your choice)
- Export singleton instances for stateless services
- Use dependency injection for testability
- Throw descriptive errors from services
- Make services pure (same input = same output when possible)

### Don'ts ❌
- Don't put business logic in controllers
- Don't access `req` or `res` in services
- Don't handle HTTP status codes in services
- Don't duplicate business logic across controllers
- Don't make services depend on each other heavily (avoid circular deps)

## Future Services to Create

Consider creating services for:
- `shop.service.ts` - Shop purchases, skin management
- `transaction.service.ts` - Financial transactions
- `achievement.service.ts` - Achievement unlocking and tracking
- `mission.service.ts` - Daily/weekly missions
- `game.service.ts` - Game session logic
- `leaderboard.service.ts` - Ranking calculations

Each service should focus on **one domain concept** and have a **single responsibility**.
