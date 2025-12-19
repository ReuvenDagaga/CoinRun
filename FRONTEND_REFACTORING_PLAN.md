# Frontend Refactoring Plan - SOLID Principles

## 🎯 Objectives
1. **Single Responsibility** - Each component/file has ONE purpose
2. **Open/Closed** - Easy to extend without modifying existing code
3. **Liskov Substitution** - Proper abstraction and interface design
4. **Interface Segregation** - Focused, minimal interfaces
5. **Dependency Inversion** - Depend on abstractions, not concrete implementations

## 📁 New Folder Structure

```
client/src/
├── app/                          # Application core
│   ├── App.tsx                   # Main app component (minimal)
│   ├── main.tsx                  # Entry point
│   └── router/                   # Routing configuration
│       ├── AppRouter.tsx
│       ├── routes.config.ts
│       └── guards/               # Route guards
│           ├── AuthGuard.tsx
│           └── GameTransitionGuard.tsx
│
├── pages/                        # Page-level components (MINIMAL - only composition)
│   ├── home/
│   │   ├── HomePage.tsx          # Max 100 lines - composition only
│   │   └── index.ts
│   ├── game/
│   │   ├── GamePage.tsx          # Max 50 lines
│   │   ├── PvPGamePage.tsx
│   │   └── index.ts
│   ├── profile/
│   │   ├── ProfilePage.tsx       # Max 50 lines
│   │   └── index.ts
│   ├── shop/
│   │   ├── ShopPage.tsx
│   │   └── index.ts
│   ├── inventory/
│   │   ├── InventoryPage.tsx
│   │   └── index.ts
│   ├── leaderboard/
│   │   ├── LeaderboardPage.tsx
│   │   └── index.ts
│   ├── pvp/
│   │   ├── PvPLobbyPage.tsx
│   │   ├── PvPResultsPage.tsx
│   │   └── index.ts
│   └── auth/
│       ├── LoginPage.tsx
│       └── index.ts
│
├── features/                     # Feature-based organization (NEW!)
│   ├── home/
│   │   ├── components/
│   │   │   ├── UpgradeGrid.tsx          # Max 150 lines
│   │   │   ├── UpgradeCard.tsx          # Max 80 lines
│   │   │   ├── ModeSelector.tsx         # Max 80 lines
│   │   │   ├── PowerLevelDisplay.tsx    # Max 50 lines
│   │   │   └── PlayButton.tsx           # Max 50 lines
│   │   ├── hooks/
│   │   │   ├── useUpgrades.ts           # Upgrade logic
│   │   │   ├── useModeSelection.ts      # Mode selection logic
│   │   │   └── useGameStart.ts          # Game start logic
│   │   ├── types/
│   │   │   └── upgrade.types.ts
│   │   ├── constants/
│   │   │   └── upgrades.config.ts
│   │   └── index.ts
│   │
│   ├── profile/
│   │   ├── components/
│   │   │   ├── ProfileHeader.tsx        # Max 80 lines
│   │   │   ├── StatsGrid.tsx            # Max 100 lines
│   │   │   ├── StatCard.tsx             # Max 50 lines
│   │   │   ├── DailyRewards.tsx         # Max 100 lines
│   │   │   ├── DailyRewardCard.tsx      # Max 50 lines
│   │   │   ├── Achievements.tsx         # Max 100 lines
│   │   │   └── AchievementCard.tsx      # Max 50 lines
│   │   ├── hooks/
│   │   │   ├── usePlayerStats.ts
│   │   │   ├── useDailyRewards.ts
│   │   │   └── useAchievements.ts
│   │   ├── types/
│   │   │   ├── stats.types.ts
│   │   │   ├── reward.types.ts
│   │   │   └── achievement.types.ts
│   │   ├── constants/
│   │   │   ├── stats.config.ts
│   │   │   └── achievements.config.ts
│   │   └── index.ts
│   │
│   ├── game/
│   │   ├── components/
│   │   │   ├── GameCanvas.tsx           # Orchestrator (Max 150 lines)
│   │   │   ├── GameWorld.tsx            # 3D world container (Max 100 lines)
│   │   │   └── GameInitializer.tsx      # Game setup (Max 100 lines)
│   │   ├── player/
│   │   │   ├── components/
│   │   │   │   ├── PlayerCharacter.tsx  # Max 150 lines
│   │   │   │   ├── PlayerController.tsx # Max 100 lines
│   │   │   │   └── OpponentCharacter.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── usePlayerMovement.ts
│   │   │   │   ├── usePlayerState.ts
│   │   │   │   └── usePlayerEffects.ts
│   │   │   └── types/
│   │   │       └── player.types.ts
│   │   ├── track/
│   │   │   ├── components/
│   │   │   │   ├── Track.tsx            # Max 100 lines
│   │   │   │   ├── TrackSegment.tsx     # Max 80 lines
│   │   │   │   ├── TrackEdges.tsx
│   │   │   │   ├── DistanceMarkers.tsx
│   │   │   │   └── FinishLine.tsx
│   │   │   ├── environment/
│   │   │   │   ├── components/
│   │   │   │   │   ├── Environment.tsx
│   │   │   │   │   ├── TrackDecorations.tsx
│   │   │   │   │   └── Gates.tsx        # Max 150 lines
│   │   │   │   ├── enemies/
│   │   │   │   │   ├── components/
│   │   │   │   │   │   ├── EnemiesManager.tsx
│   │   │   │   │   │   ├── EnemyFist.tsx
│   │   │   │   │   │   ├── EnemyBoulder.tsx
│   │   │   │   │   │   └── EnemySpinner.tsx
│   │   │   │   │   ├── hooks/
│   │   │   │   │   │   ├── useEnemyCollision.ts
│   │   │   │   │   │   └── useEnemyAnimation.ts
│   │   │   │   │   └── types/
│   │   │   │   │       └── enemy.types.ts
│   │   │   │   └── types/
│   │   │   │       └── environment.types.ts
│   │   │   ├── hooks/
│   │   │   │   ├── useTrackGeneration.ts
│   │   │   │   ├── useTrackLayout.ts
│   │   │   │   └── useChunkManager.ts
│   │   │   ├── utils/
│   │   │   │   ├── trackGenerator.util.ts
│   │   │   │   ├── chunkManager.util.ts
│   │   │   │   └── layoutManager.util.ts
│   │   │   ├── types/
│   │   │   │   └── track.types.ts
│   │   │   └── config/
│   │   │       └── track.config.ts
│   │   ├── army/
│   │   │   ├── components/
│   │   │   │   ├── ArmyManager.tsx      # Max 150 lines
│   │   │   │   ├── TieredSoldiers.tsx
│   │   │   │   ├── SoldierModel.tsx
│   │   │   │   ├── SoldierPickup.tsx
│   │   │   │   └── DeadSoldier.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useArmyState.ts
│   │   │   │   ├── useSoldierTiers.ts
│   │   │   │   └── useSoldierPickup.ts
│   │   │   └── types/
│   │   │       └── army.types.ts
│   │   ├── weapons/
│   │   │   ├── components/
│   │   │   │   ├── WeaponSystem.tsx
│   │   │   │   ├── BulletManager.tsx
│   │   │   │   ├── WeaponModel.tsx
│   │   │   │   └── DamagePopups.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useWeaponState.ts
│   │   │   │   ├── useBulletPhysics.ts
│   │   │   │   └── useWeaponUpgrade.ts
│   │   ���   └── types/
│   │   │       └── weapon.types.ts
│   │   ├── collectibles/
│   │   │   ├── components/
│   │   │   │   ├── CoinsManager.tsx
│   │   │   │   └── CoinModel.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useCoinCollection.ts
│   │   │   │   └── useMagnetEffect.ts
│   │   │   └── types/
│   │   │       └── coin.types.ts
│   │   ├── characters/
│   │   │   ├── components/
│   │   │   │   ├── CharacterModel.tsx
│   │   │   │   ├── CharacterRig.tsx     # Max 200 lines
│   │   │   │   └── CharacterSelector.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useCharacterAnimation.ts
│   │   │   │   └── useCharacterRigging.ts
│   │   │   └── types/
│   │   │       └── character.types.ts
│   │   ├── camera/
│   │   │   ├── components/
│   │   │   │   ├── GameCamera.tsx
│   │   │   │   └── EndGameCamera.tsx
│   │   │   └── hooks/
│   │   │       └── useCameraControl.ts
│   │   ├── endgame/
│   │   │   ├── components/
│   │   │   │   ├── EndGameSequence.tsx
│   │   │   │   ├── Stairs.tsx
│   │   │   │   ├── StairClimbController.tsx
│   │   │   │   ├── FinishGate.tsx
│   │   │   │   └── Confetti.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useStairClimbing.ts
│   │   │   │   └── useEndGameRewards.ts
│   │   │   └── types/
│   │   │       └── endgame.types.ts
│   │   ├── effects/
│   │   │   ├── components/
│   │   │   │   └── EffectManager.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useSpeedEffects.ts
│   │   │   │   ├── useShieldEffect.ts
│   │   │   │   ├── useGiantEffect.ts
│   │   │   │   └── useReverseControls.ts
│   │   │   └── types/
│   │   │       └── effect.types.ts
│   │   ├── hooks/
│   │   │   ├── useGameLoop.ts           # Main game loop
│   │   │   ├── useGameState.ts          # Game state management
│   │   │   ├── useGameInput.ts          # Input handling
│   │   │   ├── useCollisionDetection.ts # Collision system
│   │   │   └── useGameLoader.ts         # Asset loading
│   │   └── index.ts
│   │
│   ├── pvp/
│   │   ├── components/
│   │   │   ├── PvPLobby.tsx
│   │   │   ├── PvPMatchmaking.tsx
│   │   │   ├── PvPResults.tsx
│   │   │   └── PvPHUD.tsx
│   │   ├── hooks/
│   │   │   ├── usePvPSocket.ts
│   │   │   ├── usePvPMatchmaking.ts
│   │   │   ├── usePvPGameState.ts
│   │   │   └── useOpponentSync.ts
│   │   └── types/
│   │       └── pvp.types.ts
│   │
│   ├── shop/
│   │   ├── components/
│   │   │   ├── ShopGrid.tsx
│   │   │   ├── ShopSection.tsx
│   │   │   ├── ShopCard.tsx
│   │   │   ├── GiftCard.tsx
│   │   │   ├── ComboCard.tsx
│   │   │   └── CrateSection.tsx
│   │   ├── hooks/
│   │   │   ├── useShopItems.ts
│   │   │   └── usePurchase.ts
│   │   ├── types/
│   │   │   └── shop.types.ts
│   │   └── config/
│   │       └── shop.config.ts
│   │
│   ├── inventory/
│   │   ├── components/
│   │   │   ├── InventoryGrid.tsx
│   │   │   └── AssetCard.tsx
│   │   ├── hooks/
│   │   │   ├── useInventory.ts
│   │   │   └── useAssetEquip.ts
│   │   └── types/
│   │       └── inventory.types.ts
│   │
│   ├── leaderboard/
│   │   ├── components/
│   │   │   ├── LeaderboardList.tsx
│   │   │   └── LeaderboardEntry.tsx
│   │   ├── hooks/
│   │   │   └── useLeaderboard.ts
│   │   └── types/
│   │       └── leaderboard.types.ts
│   │
│   └── auth/
│       ├── components/
│       │   ├── LoginForm.tsx
│       │   └── AuthGuard.tsx
│       ├── hooks/
│       │   ├── useLogin.ts
│       │   └── useAuthState.ts
│       └── types/
│           └── auth.types.ts
│
├── shared/                       # Shared UI components
│   ├── ui/
│   │   ├── buttons/
│   │   │   ├── Button.tsx
│   │   │   ├── IconButton.tsx
│   │   │   ├── FloatingNavButton.tsx
│   │   │   └── index.ts
│   │   ├── loading/
│   │   │   ├── BaseLoading.tsx
│   │   │   ├── ButtonSpinner.tsx
│   │   │   ├── UnifiedGameLoading.tsx
│   │   │   └── index.ts
│   │   ├── feedback/
│   │   │   ├── Toast.tsx
│   │   │   ├── DamagePopup.tsx
│   │   │   └── index.ts
│   │   ├── overlays/
│   │   │   ├── DisconnectionOverlay.tsx
│   │   │   ├── InactivityWarning.tsx
│   │   │   └── index.ts
│   │   ├── display/
│   │   │   ├── HUD.tsx
│   │   │   ├── PostGame.tsx
│   │   │   ├── FPSDisplay.tsx
│   │   │   └── index.ts
│   │   ├── navigation/
│   │   │   ├── FloatingNavManager.tsx
│   │   │   ├── Navbar.tsx
│   │   │   └── index.ts
│   │   ├── text/
│   │   │   ├── TextWithShadow.tsx
│   │   │   └── index.ts
│   │   └── layout/
│   │       ├── Layout.tsx
│   │       ├── Header.tsx
│   │       └── index.ts
│   │
│   ├── 3d/
│   │   ├── Character3D.tsx
│   │   └── index.ts
│   │
│   └── icons/
│       ├── BagIcon.tsx
│       ├── SearchIcon.tsx
│       ├── [other icons...]
│       └── index.ts
│
├── core/                         # Core application logic
│   ├── state/
│   │   ├── contexts/
│   │   │   ├── GameContext/
│   │   │   │   ├── GameContext.tsx      # Context only (Max 100 lines)
│   │   │   │   ├── GameProvider.tsx     # Provider logic
│   │   │   │   ├── useGameContext.ts    # Hook
│   │   │   │   └── index.ts
│   │   │   ├── AuthContext/
│   │   │   │   ├── AuthContext.tsx
│   │   │   │   ├── AuthProvider.tsx
│   │   │   │   ├── useAuthContext.ts
│   │   │   │   └── index.ts
│   │   │   ├── UIContext/
│   │   │   │   ├── UIContext.tsx
│   │   │   │   ├── UIProvider.tsx
│   │   │   │   ├── useUIContext.ts
│   │   │   │   └── index.ts
│   │   │   ├── WeaponContext/
│   │   │   │   ├── WeaponContext.tsx
│   │   │   │   ├── WeaponProvider.tsx
│   │   │   │   ├── useWeaponContext.ts
│   │   │   │   └── index.ts
│   │   │   └── ToastContext/
│   │   │       ├── ToastContext.tsx
│   │   │       ├── ToastProvider.tsx
│   │   │       ├── useToastContext.ts
│   │   │       └── index.ts
│   │   └── index.ts
│   │
│   ├── services/
│   │   ├── api/
│   │   │   ├── client.ts            # HTTP client base
│   │   │   ├── endpoints.ts         # API endpoints
│   │   │   └── index.ts
│   │   ├── auth/
│   │   │   ├── auth.service.ts
│   │   │   └── index.ts
│   │   ├── socket/
│   │   │   ├── socket.service.ts
│   │   │   ├── pvpSocket.service.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   │
│   └── types/
│       ├── app.types.ts
│       └── index.ts
│
├── lib/                          # Utilities and helpers
│   ├── hooks/
│   │   ├── common/
│   │   │   ├── useLocalStorage.ts
│   │   │   ├── useDebounce.ts
│   │   │   ├── useThrottle.ts
│   │   │   └── index.ts
│   │   ├── game/
│   │   │   ├── useSwipeDetector.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   │
│   ├── utils/
│   │   ├── input/
│   │   │   ├── swipeDetector.ts
│   │   │   ├── inputHandler.ts
│   │   │   └── index.ts
│   │   ├── physics/
│   │   │   ├── collision.ts
│   │   │   ├── interpolation.ts
│   │   │   └── index.ts
│   │   ├── math/
│   │   │   ├── vector.ts
│   │   │   └── index.ts
│   │   ├── audio/
│   │   │   ├── audioManager.ts
│   │   │   └── index.ts
│   │   ├── validation/
│   │   │   ├── tokenValidator.ts
│   │   │   └── index.ts
│   │   ├── styling/
│   │   │   ├── textShadow.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   │
│   ├── constants/
│   │   ├── game.constants.ts
│   │   ├── ui.constants.ts
│   │   └── index.ts
│   │
│   └── multiplayer/
│       ├── InputHandler.ts
│       ├── EntityInterpolation.ts
│       └── index.ts
│
└── assets/                       # Static assets (if needed)
    └── styles/
        └── index.css
```

## 🔨 Refactoring Strategy

### Phase 1: Core Infrastructure (1st Priority)
1. ✅ Create new folder structure
2. ✅ Setup barrel exports (index.ts files)
3. ✅ Move and organize constants
4. ✅ Move and organize utils
5. ✅ Split contexts into smaller files

### Phase 2: Hooks Extraction (2nd Priority)
Extract ALL business logic to hooks:
- `useGameState` - Game state management
- `usePlayerMovement` - Player movement logic
- `useCollisionDetection` - Collision detection
- `useTrackGeneration` - Track generation logic
- `useArmyManagement` - Army management
- `useWeaponSystem` - Weapon system logic
- `useEffectSystem` - Effect management (shield, giant, etc.)
- `useCoinCollection` - Coin collection logic
- `useEndGame` - End game sequence logic
- `useUpgrades` - Upgrade system
- `useDailyRewards` - Daily rewards logic
- `useAchievements` - Achievement tracking

### Phase 3: Component Splitting (3rd Priority)

#### GameScene.tsx (865 lines) → Break into:
1. `GameCanvas.tsx` (orchestrator) - ~150 lines
2. `GameWorld.tsx` (3D world) - ~100 lines
3. `GameInitializer.tsx` (setup) - ~100 lines
4. Extract all logic to hooks

#### GameContext.tsx (877 lines) → Break into:
1. `GameContext.tsx` (context definition) - ~50 lines
2. `GameProvider.tsx` (provider with logic) - ~200 lines
3. `useGameActions.ts` (action hooks) - ~150 lines
4. `useGameEffects.ts` (effect hooks) - ~150 lines
5. `useEndGameLogic.ts` (end game logic) - ~100 lines

#### Home.tsx (259 lines) → Break into:
1. `HomePage.tsx` (composition) - ~50 lines
2. `UpgradeGrid.tsx` - ~120 lines
3. `UpgradeCard.tsx` - ~60 lines
4. `ModeSelector.tsx` - ~60 lines
5. `useUpgrades.ts` - ~80 lines
6. `useModeSelection.ts` - ~30 lines

#### Profile.tsx (259 lines) → Break into:
1. `ProfilePage.tsx` (composition) - ~30 lines
2. `ProfileHeader.tsx` - ~60 lines
3. `StatsGrid.tsx` + `StatCard.tsx` - ~80 lines
4. `DailyRewards.tsx` + `DailyRewardCard.tsx` - ~100 lines
5. `Achievements.tsx` + `AchievementCard.tsx` - ~80 lines

### Phase 4: Feature Organization (4th Priority)
Group related components by feature (not by type):
- ✅ All game-related components → `features/game/`
- ✅ All profile-related components → `features/profile/`
- ✅ All shop-related components → `features/shop/`
- ✅ etc.

### Phase 5: Import Updates (5th Priority)
Update all imports to use:
- Barrel exports (`from '@/features/game'`)
- Path aliases (`@/shared/ui`, `@/lib/hooks`, etc.)

## 🎯 Component Size Guidelines

| Component Type | Max Lines | Purpose |
|---------------|-----------|---------|
| Page | 100 | Composition only |
| Feature Component | 150 | Business logic component |
| UI Component | 100 | Pure presentation |
| Hook | 150 | Single responsibility logic |
| Util | 200 | Utility functions |
| Context | 100 | Context definition + provider |

## ✨ SOLID Principles Applied

### Single Responsibility
- Each component renders ONE thing
- Each hook manages ONE aspect of state/logic
- Each util performs ONE operation

### Open/Closed
- Use composition over inheritance
- Extend via props, not modification
- Use render props and compound components

### Liskov Substitution
- Proper TypeScript interfaces
- Consistent component APIs
- Predictable behavior

### Interface Segregation
- Small, focused interfaces
- No bloated prop types
- Specific hooks for specific needs

### Dependency Inversion
- Depend on hooks (abstractions)
- Not on concrete implementations
- Inject dependencies via context/props

## 📋 Naming Conventions

### Files
- Components: `PascalCase.tsx`
- Hooks: `useCamelCase.ts`
- Utils: `camelCase.util.ts`
- Types: `camelCase.types.ts`
- Constants: `UPPER_SNAKE.constants.ts`
- Config: `camelCase.config.ts`

### Components
- UI Components: `Button`, `Card`, `Modal`
- Feature Components: `UpgradeCard`, `PlayerCharacter`
- Page Components: `HomePage`, `ProfilePage`
- Layout Components: `Layout`, `Header`

### Hooks
- State hooks: `useState`, `useGameState`
- Effect hooks: `useEffect`, `usePlayerMovement`
- Context hooks: `useAuth`, `useGame`
- Custom hooks: `useSwipeDetector`, `useDebounce`

## 🚀 Migration Path

1. Create new folder structure
2. Move utils and constants (no dependencies)
3. Split and move contexts
4. Extract hooks from components
5. Split large components
6. Move components to feature folders
7. Update all imports
8. Test thoroughly
9. Remove old files

## ✅ Success Criteria

- ✅ No component > 150 lines
- ✅ No hook > 150 lines
- ✅ All business logic in hooks
- ✅ Clear separation of concerns
- ✅ Feature-based organization
- ✅ Easy to find and modify code
- ✅ Follows SOLID principles
- ✅ No circular dependencies
- ✅ Proper TypeScript types
- ✅ All tests passing
