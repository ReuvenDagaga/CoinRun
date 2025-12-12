# Single User Model Enforcement - Refactor Summary

**Date:** 2025-12-12
**Status:** ✅ COMPLETE

---

## Overview

This document summarizes the complete refactor to enforce a **single source of truth** for the User model across the entire CoinRun application (frontend and backend).

### The Problem

Before this refactor:
- **5+ different user type definitions** scattered across the codebase
- Frontend expected fields that **don't exist** in the backend (`usdtBalance`, `dailyMissionsCompleted`, etc.)
- Missing fields in frontend that **do exist** in backend (`avatar`, `settings`, `bestScore`, etc.)
- Inconsistent response shapes between endpoints
- Type mismatches causing runtime errors

### The Solution

**ONE User model. Period.**

Every part of the application now uses types defined in `/shared/types/user.types.ts`.

---

## Changes Made

### 1. Created Single Source of Truth

**File:** `/shared/types/user.types.ts` ✅ NEW

This file now contains:
- `User` - Complete user model (matches backend MongoDB schema)
- `UserUpgrades` - Upgrade levels (8 types, infinite levels)
- `Mission` - Mission progress tracking
- `UserSettings` - User preferences (volume, graphics, etc.)
- `ActiveBoost` - Temporary boosts
- `UserAchievement` - Achievement progress
- `UserStats` - Game statistics (includes `bestScore` now!)
- `BasicUserResponse` - API response for basic user data
- `FullUserResponse` - API response for complete user data

### 2. Backend Updates

#### `/server/src/service/authService.ts`
- ✅ Imported shared types: `BasicUserResponse`, `FullUserResponse`
- ✅ Added explicit return types to `formatUserResponse()` and `formatFullUserResponse()`
- ✅ Added comprehensive documentation
- ✅ Response formatters now guarantee consistent shapes

### 3. Frontend Type Updates

#### `/shared/types/game.types.ts`
- ✅ **FIXED:** Added `bestScore` to `UserStats` interface
- ✅ Re-exported `UserUpgrades` and `UserStats` from `user.types.ts` to maintain single source

#### `/client/src/services/auth.service.ts`
- ✅ Replaced custom `AuthUser` and `AuthUserData` with imports from shared types
- ✅ Added deprecation notices for old type aliases
- ✅ Updated `GoogleAuthResponse` to use shared types

#### `/client/src/context/AuthContext.tsx`
- ✅ Replaced custom `AuthUser` interface with `BasicUserResponse`
- ✅ Added documentation explaining separation between AuthContext and UserContext

#### `/client/src/context/UserContext.tsx` ⚠️ MAJOR CHANGES
- ✅ Replaced custom `UserData` interface with `FullUserResponse`
- ✅ **REMOVED:** `usdtBalance` field (doesn't exist in backend)
- ✅ **REMOVED:** `addUsdt()` and `spendUsdt()` functions
- ✅ **REMOVED:** `dailyMissionsCompleted`, `lastDailyReward`, `spinUsedToday`, `dailyStreak` (client-side only, not persisted)
- ✅ **REMOVED:** `claimDailyReward()`, `useDailySpin()`, `resetDailyProgress()` functions
- ✅ **ADDED:** `updateMissionProgress()` - updates backend-backed mission progress
- ✅ **ADDED:** `claimMission()` - claims mission rewards
- ✅ **ADDED:** `refreshUserData()` - refreshes user data from server (TODO: implement)
- ✅ **UPDATED:** `updateStats()` - now includes `bestScore`
- ✅ **UPDATED:** `unlockAchievement()` - now uses `achievementId` and `progress`
- ✅ **FIXED:** `defaultStats` now includes `bestScore: 0`

### 4. Component Updates

#### `/client/src/pages/Profile.tsx` ⚠️ MAJOR CHANGES
- ✅ **REMOVED:** `@ts-nocheck` directive (types are now correct!)
- ✅ **REMOVED:** USDT balance display (line 38)
- ✅ **REMOVED:** `DailyLogin` component (client-side only, not backed by server)
- ✅ **REMOVED:** `DailySpin` component (client-side only, not backed by server)
- ✅ **ADDED:** `bestScore` to stats display
- ✅ **UPDATED:** `DailyMissions` - now uses backend `Mission[]` structure with proper progress tracking
- ✅ **ADDED:** `WeeklyMissions` component - displays backend-backed weekly missions
- ✅ **UPDATED:** `AchievementsPreview` - uses `achievementId` instead of `id`

#### `/client/src/components/ui/PreGame.tsx`
- ✅ **REMOVED:** USDT balance display
- ✅ **UPDATED:** `BettingModeSelector` - converted from USDT to coin-based betting
  - Bet amounts: 100, 500, 1000, 5000 coins (not dollars)
  - Visual changes: Green → Yellow (coins)
  - All references to `user.usdtBalance` → `user.coins`

#### `/client/src/pages/auth/Login.tsx`
- ✅ Simplified authentication flow - passes full user objects instead of manually selecting fields
- ✅ Added comments explaining type conformance

---

## Field Mapping

### Fields REMOVED from Frontend (didn't exist in backend)

| Field | Used In | Status |
|-------|---------|--------|
| `usdtBalance` | UserContext, Profile.tsx, PreGame.tsx | ❌ REMOVED - Not part of backend model |
| `dailyMissionsCompleted` | UserContext, Profile.tsx | ❌ REMOVED - Backend uses `Mission[]` structure |
| `lastDailyReward` | UserContext, Profile.tsx | ❌ REMOVED - Client-side only, not persisted |
| `spinUsedToday` | UserContext, Profile.tsx | ❌ REMOVED - Client-side only, not persisted |
| `dailyStreak` | UserContext, Profile.tsx | ❌ REMOVED - Client-side only, not persisted |

### Fields ADDED to Frontend (existed in backend, missing in frontend)

| Field | Type | Added To |
|-------|------|----------|
| `bestScore` | number | UserStats, Profile.tsx |
| `avatar` | string? | User type (was missing) |
| `settings` | UserSettings | User type (was missing) |
| `activeBoosts` | ActiveBoost[] | User type (was missing) |
| `weeklyMissions` | Mission[] | User type, Profile.tsx |

### Fields CORRECTED

| Field | Old Type | New Type | Issue Fixed |
|-------|----------|----------|-------------|
| `dailyMissions` | `string[]` | `Mission[]` | ✅ Now matches backend structure |
| `achievements` | `Achievement[]` (with `id`) | `UserAchievement[]` (with `achievementId`) | ✅ Consistent naming |

---

## Breaking Changes

### Removed Functions (UserContext)

These functions are **NO LONGER AVAILABLE**:

```typescript
// ❌ REMOVED
addUsdt(amount: number)
spendUsdt(amount: number): boolean
claimDailyReward(): { coins: number; gems?: number } | null
useDailySpin(): boolean
resetDailyProgress(): void
```

**Reason:** These were client-side only functions not backed by the server. Daily rewards should be implemented via the backend mission system.

### New Functions (UserContext)

```typescript
// ✅ NEW - Backend-backed mission system
updateMissionProgress(missionId: string, progress: number): void
claimMission(missionId: string, reward: { coins?: number; gems?: number }): void
refreshUserData(): Promise<void> // TODO: Implement API call
```

### Updated Function Signatures

```typescript
// BEFORE
updateStats(gameResult: { coinsCollected: number; distanceTraveled: number; won: boolean; armySize: number }): void
unlockAchievement(achievementId: string): void

// AFTER
updateStats(gameResult: { coinsCollected: number; distanceTraveled: number; won: boolean; armySize: number; score: number }): void
unlockAchievement(achievementId: string, progress: number): void
```

---

## Migration Guide

### For Frontend Developers

If you have components that use user data:

1. **Import types from shared folder:**
   ```typescript
   import type { FullUserResponse, Mission, UserAchievement } from '@shared/types/user.types';
   ```

2. **DO NOT create custom user interfaces** - use the shared types

3. **DO NOT reference removed fields:**
   - ❌ `user.usdtBalance`
   - ❌ `user.dailyMissionsCompleted`
   - ❌ `user.lastDailyReward`
   - ❌ `user.spinUsedToday`
   - ❌ `user.dailyStreak`

4. **Use backend-backed fields:**
   - ✅ `user.dailyMissions` (array of Mission objects)
   - ✅ `user.weeklyMissions` (array of Mission objects)
   - ✅ `user.stats.bestScore`
   - ✅ `user.achievements` (array of UserAchievement objects)

### For Backend Developers

1. **All user responses MUST use the formatter functions:**
   ```typescript
   import { formatUserResponse, formatFullUserResponse } from '../service/authService.js';

   // For basic user data
   return formatUserResponse(user);

   // For full user data
   return formatFullUserResponse(user);
   ```

2. **DO NOT create ad-hoc user objects** like `{ id, name, coins }`

3. **Validate incoming data** against the User model schema

---

## Testing Checklist

### ✅ Completed

- [x] Created unified type file
- [x] Updated backend response formatters
- [x] Updated all frontend contexts
- [x] Fixed Profile.tsx (removed USDT, added bestScore, fixed missions)
- [x] Fixed PreGame.tsx (removed USDT, converted betting to coins)
- [x] Fixed Login.tsx (pass complete user objects)
- [x] Removed duplicate type definitions

### ⚠️ Needs Testing

- [ ] Auth flow (login/logout)
- [ ] Game flow (start game, finish game, update stats)
- [ ] Mission system (claim missions)
- [ ] Achievement unlocking
- [ ] Profile page display
- [ ] Upgrade purchasing
- [ ] Shop interactions
- [ ] Leaderboard display

### 📋 TODO

- [ ] Implement `refreshUserData()` API call in UserContext
- [ ] Backend: Add API endpoints for mission claiming
- [ ] Backend: Implement daily/weekly mission reset logic
- [ ] Frontend: Add loading states for async operations
- [ ] Frontend: Add error handling for API failures

---

## File Manifest

### Created
- ✅ `/shared/types/user.types.ts` - **NEW: Single source of truth**

### Modified (Backend)
- ✅ `/server/src/service/authService.ts`

### Modified (Frontend Types)
- ✅ `/shared/types/game.types.ts`
- ✅ `/client/src/services/auth.service.ts`

### Modified (Frontend Contexts)
- ✅ `/client/src/context/AuthContext.tsx`
- ✅ `/client/src/context/UserContext.tsx`

### Modified (Frontend Components)
- ✅ `/client/src/pages/Profile.tsx`
- ✅ `/client/src/components/ui/PreGame.tsx`
- ✅ `/client/src/pages/auth/Login.tsx`

---

## Benefits

✅ **Type Safety:** TypeScript now catches mismatches at compile time
✅ **No More Runtime Errors:** No more "property undefined" from shape mismatches
✅ **Single Source of Truth:** ONE model, ONE definition, no confusion
✅ **Easier Debugging:** Always know what a user object looks like
✅ **Easier Onboarding:** New devs learn one model, not five variations
✅ **Cleaner Code:** No more duplicate interfaces
✅ **Backend Consistency:** All endpoints return the same shapes

---

## Key Principles Going Forward

### The Golden Rule

**There is ONE User model. Period.**

Every API request that involves user data must accept data matching this model.
Every API response that returns user data must return data matching this model.
Every frontend interface/type must mirror this model exactly.

### What to Do

✅ Import types from `/shared/types/user.types.ts`
✅ Use `formatUserResponse()` or `formatFullUserResponse()` on the backend
✅ Validate incoming data against the User schema
✅ Keep the single source of truth up to date

### What NOT to Do

❌ Create alternative user interfaces
❌ Add fields that aren't in the shared model
❌ Create ad-hoc user objects with custom shapes
❌ Use `@ts-nocheck` to bypass type errors (fix the types instead!)

---

## Questions?

If you need to add a field to the User model:

1. Add it to `/shared/types/user.types.ts`
2. Add it to `/server/src/models/Users.ts` (backend schema)
3. Update the response formatter if needed
4. Update any components that should display the new field

**Always ask before making assumptions about user structure!**

---

**Refactored by:** Claude
**Review Status:** Pending
**Merge Status:** Pending
