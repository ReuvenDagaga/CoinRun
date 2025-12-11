# CoinRun Infrastructure Overhaul - Implementation Plan

## 📋 Current State Analysis

### ✅ What Works
- Core game mechanics (army, gates, coins, enemies)
- Basic authentication (JWT with Google OAuth)
- MongoDB integration
- React Three Fiber 3D game
- Zustand state management
- Express.js backend with Socket.io

### ❌ What's Broken/Needs Removal
- **USDT balance tracking** (database field only, no real crypto)
- **Betting system** (1v1 with USDT stakes via Socket.io)
- **Wallet routes** (/wallet/balance, /wallet/transactions)
- **Shop USDT purchases** (buy gems with USDT)
- **Transaction history** (crypto-focused)
- **Anonymous login** (should force Google OAuth)
- **Incomplete UI** (basic Home, no Profile/Settings/Missions)

---

## 🎯 Implementation Phases

### **PHASE 1: Database Cleanup** ⚡ PRIORITY
Remove all crypto-related database fields and collections.

#### Files to Modify:
1. **`/home/user/CoinRun/server/src/models/Users.ts`**
   - ❌ Remove: `usdtBalance: number`
   - ✅ Add: `missions`, `achievements`, `settings` subdocuments
   - ✅ Update upgrades to support infinite levels (remove max level limits)

2. **`/home/user/CoinRun/server/src/models/Transactions.ts`**
   - ❌ DELETE ENTIRE FILE (crypto-focused transaction tracking)
   - Alternative: Keep for in-game transactions only (coins/gems)
   - ✅ If keeping: Remove `currency: 'usdt'` type, keep only 'coins' | 'gems'

3. **`/home/user/CoinRun/server/src/models/RunnerGame.ts`**
   - ❌ Remove: `betAmount: number`
   - ❌ Remove: `gameType: '1v1'` (keep only 'solo')
   - ❌ Remove: `winnerId: ObjectId`

#### New Schemas to Create:
1. **`Mission.ts`** - Daily/weekly mission tracking
2. **`Achievement.ts`** - Achievement definitions and progress

---

### **PHASE 2: Backend API Cleanup** 🔥 CRITICAL

#### Routes to Remove:
**File:** `/home/user/CoinRun/server/src/routers/mainRoutes.ts`

```typescript
// ❌ REMOVE these routes:
router.get('/wallet/balance', ...)           // Line ~169
router.get('/wallet/transactions', ...)      // Line ~180
router.post('/shop/buy/gems', ...)           // USDT purchase
```

#### Controllers to Update:
1. **`/home/user/CoinRun/server/src/controllers/authController.ts`**
   - ❌ Remove `anonymousLogin` function
   - ❌ Remove `upgradeAnonymousAccount` function
   - ✅ Keep only: `register`, `login`, `googleAuth`, `getMe`, `logout`
   - ✅ Make Google OAuth mandatory

2. **`/home/user/CoinRun/server/src/controllers/shopController.ts`**
   - ❌ Remove `buyGemsWithUSDT` function
   - ✅ Update shop purchases to use coins/gems only

3. **`/home/user/CoinRun/server/src/controllers/upgradeController.ts`**
   - ✅ Update upgrade cost calculation to use exponential formula: `baseCost × (1.5 ^ level)`
   - ✅ Remove max level restrictions
   - ✅ Add power multiplier every 10 levels

#### New Controllers to Create:
1. **`missionController.ts`** - Handle mission progress, claim rewards
2. **`achievementController.ts`** - Track and unlock achievements
3. **`settingsController.ts`** - User settings management

#### Socket.io Cleanup:
**File:** `/home/user/CoinRun/server/src/socket/Runner/socket.ts`

```typescript
// ❌ REMOVE entire betting system (lines 30-115):
socket.on('betting:queue', ...)  // Matchmaking with USDT validation
// ❌ Remove betting queue logic
// ❌ Remove power level matchmaking
// ❌ Remove bet amount tracking
```

**Keep only:**
- Solo game state tracking (if needed)
- Leaderboard updates

---

### **PHASE 3: Frontend Cleanup** 🧹

#### State Management Cleanup:
**File:** `/home/user/CoinRun/client/src/store/userStore.ts`

```typescript
// ❌ Remove from state:
usdtBalance: number

// ✅ Add to state:
missions: Mission[]
achievements: Achievement[]
settings: UserSettings
```

#### API Service Cleanup:
**File:** `/home/user/CoinRun/client/src/services/api.ts`

```typescript
// ❌ Remove endpoints:
- getWalletBalance()
- getTransactions()
- buyGemsWithUSDT(amount)

// ✅ Add new endpoints:
- getMissions()
- claimMission(id)
- getAchievements()
- updateSettings(settings)
```

#### Component Cleanup:
1. **`/home/user/CoinRun/client/src/components/ui/PreGame.tsx`**
   - ❌ Remove 1v1 Betting mode button
   - ❌ Remove bet amount input
   - ✅ Keep only Solo mode button

---

### **PHASE 4: Authentication Overhaul** 🔐

#### Requirements:
- Force login before ANY action
- No anonymous users
- No username/password (Google OAuth only for now)
- Auto-login with stored JWT token

#### New Components to Create:
1. **`/home/user/CoinRun/client/src/pages/Login.tsx`**
   ```jsx
   - Splash screen with logo
   - "Sign in with Google" button (large)
   - Legal text with Terms & Privacy links
   - Cannot skip or bypass
   ```

2. **`/home/user/CoinRun/client/src/components/SplashScreen.tsx`**
   ```jsx
   - Show on app load
   - Check for stored JWT token
   - If token exists → verify with server → proceed to Home
   - If no token → redirect to Login
   ```

#### App.tsx Update:
```typescript
// New flow:
1. Show SplashScreen
2. Check localStorage for token
3. If token → validate with API
4. If valid → load user data → navigate to Home
5. If invalid → clear token → navigate to Login
6. Protected routes: All pages except Login
```

---

### **PHASE 5: Database Schema Updates** 📊

#### Updated User Schema:
```typescript
interface IUser {
  // Basic Info
  _id: ObjectId
  googleId: string (unique, required)
  email: string (required)
  username: string
  avatar: string

  // Currency (VIRTUAL ONLY)
  coins: number (default: 0)
  gems: number (default: 0)
  // ❌ REMOVED: usdtBalance

  // Upgrades (INFINITE LEVELS)
  upgrades: {
    speed: number (default: 0)
    armyCapacity: number (default: 0)
    startingArmy: number (default: 0)
    coinValue: number (default: 0)
    magnetRadius: number (default: 0)
    // Add more as needed
  }

  // Stats
  gamesPlayed: number
  gamesWon: number
  totalCoinsCollected: number
  bestScore: number
  totalDistance: number

  // Missions
  dailyMissions: {
    missionId: string
    progress: number
    completed: boolean
    claimed: boolean
  }[]
  weeklyMissions: similar[]
  lastDailyReset: Date
  lastWeeklyReset: Date

  // Achievements
  achievements: {
    achievementId: string
    progress: number
    unlocked: boolean
    unlockedAt: Date
  }[]

  // Shop
  ownedSkins: string[]
  activeSkin: string
  activeBoosts: {
    boostId: string
    expiresAt: Date
  }[]

  // Settings
  settings: {
    masterVolume: number (0-1)
    musicVolume: number (0-1)
    sfxVolume: number (0-1)
    graphicsQuality: 'low' | 'medium' | 'high'
    showFPS: boolean
    controlSensitivity: number (0-1)
  }

  createdAt: Date
  updatedAt: Date
}
```

#### New Mission Schema:
```typescript
interface IMission {
  _id: ObjectId
  type: 'daily' | 'weekly'
  title: string
  description: string
  requirement: {
    type: 'play_games' | 'collect_coins' | 'reach_army' | 'complete_without_hit' | 'finish_under_time'
    target: number
  }
  reward: {
    coins?: number
    gems?: number
  }
  active: boolean
  createdAt: Date
}
```

#### New Achievement Schema:
```typescript
interface IAchievement {
  _id: ObjectId
  achievementId: string (unique)
  name: string
  description: string
  icon: string
  requirement: {
    type: string
    target: number
  }
  reward: {
    coins?: number
    gems?: number
  }
  createdAt: Date
}
```

#### Updated RunnerGame Schema:
```typescript
interface IRunnerGame {
  _id: ObjectId
  userId: ObjectId
  gameType: 'solo' // ❌ Removed '1v1'

  // ❌ REMOVED: betAmount, winnerId

  // Game data
  startedAt: Date
  finishedAt: Date
  duration: number

  coinsCollected: number
  finalScore: number
  distance: number
  maxArmy: number

  // Snapshot of upgrade levels at game time
  upgradeLevels: {
    speed: number
    armyCapacity: number
    // ...
  }

  trackSeed: string
  trackDifficulty: number
  status: 'pending' | 'in_progress' | 'finished'
}
```

---

### **PHASE 6: New API Endpoints** 🔌

#### Authentication (Updated):
```typescript
POST   /api/auth/google           // Google OAuth callback (REQUIRED)
POST   /api/auth/logout           // Logout
GET    /api/auth/me               // Get current user

// ❌ REMOVE:
// POST /api/auth/anonymous
// POST /api/auth/upgrade-anonymous
// POST /api/auth/register (username/password)
// POST /api/auth/login (username/password)
```

#### User:
```typescript
GET    /api/users/me              // Get full user data
GET    /api/users/stats           // Get user statistics
PUT    /api/users/settings        // Update settings
PUT    /api/users/profile         // Update profile (username, avatar)
```

#### Game (Solo Only):
```typescript
POST   /api/game/start            // Start solo game
POST   /api/game/finish           // Submit game results + anti-cheat
GET    /api/games/history         // Get game history
GET    /api/games/leaderboard     // Get leaderboard
```

#### Upgrades (Infinite):
```typescript
GET    /api/upgrades              // Get all upgrades with levels + costs
POST   /api/upgrades/purchase     // Purchase upgrade (coins only)
  Body: { upgradeType: 'speed' }
  Returns: { newLevel, cost, newBalance }
```

#### Missions:
```typescript
GET    /api/missions/list         // Get all missions + progress
POST   /api/missions/claim        // Claim mission reward
  Body: { missionId: string }
  Returns: { coins, gems, newBalance }
```

#### Shop (No USDT):
```typescript
GET    /api/shop/items            // Get all shop items
POST   /api/shop/purchase         // Purchase item
  Body: { itemId: string, currency: 'coins' | 'gems' }
GET    /api/shop/owned            // Get owned items
```

#### Achievements:
```typescript
GET    /api/achievements          // Get all achievements + progress
```

---

### **PHASE 7: UI Screen Development** 🎨

#### 1. Login Screen
**File:** `/home/user/CoinRun/client/src/pages/Login.tsx`

Layout:
```
┌─────────────────────────────┐
│                             │
│       [GAME LOGO]           │
│                             │
│  ┌─────────────────────┐   │
│  │ 🔐 Sign in with     │   │
│  │    Google           │   │
│  └─────────────────────┘   │
│                             │
│  By signing in, you agree  │
│  to our Terms of Service   │
│  and Privacy Policy        │
│                             │
└─────────────────────────────┘
```

#### 2. Home Screen (Redesign)
**File:** `/home/user/CoinRun/client/src/pages/Home.tsx`

Layout:
```
┌─────────────────────────────┐
│  🏠 Home  👤 Profile  ⚙️    │ ← Top Nav
├─────────────────────────────┤
│                             │
│   Welcome, [Username]!      │
│                             │
│   💰 1,247 Coins            │
│   💎 35 Gems                │
│                             │
│  ┌─────────────────────┐   │
│  │   [PLAY GAME]       │   │
│  │   🎮 Start Running! │   │
│  └─────────────────────┘   │
│                             │
│  ┌─────────────────────┐   │
│  │  UPGRADES           │   │
│  │  [4 cards scroll →] │   │
│  └─────────────────────┘   │
│                             │
│  ┌─────────────────────┐   │
│  │  DAILY MISSIONS     │   │
│  │  ✓ Play 3 Games     │   │
│  │  ○ Collect 100 Coins│   │
│  │  [See All →]        │   │
│  └─────────────────────┘   │
│                             │
│  [Shop] [Leaderboard]      │
└─────────────────────────────┘
```

#### 3. Profile Screen (NEW)
**File:** `/home/user/CoinRun/client/src/pages/Profile.tsx`

Layout:
```
┌─────────────────────────────┐
│  ← Back        PROFILE      │
├─────────────────────────────┤
│      [Avatar Image]         │
│      Username123            │
│      user@email.com         │
│                             │
│  ┌─────────────────────┐   │
│  │  STATS              │   │
│  │  Games: 127         │   │
│  │  Wins: 89 (70%)     │   │
│  │  Best: 45,200       │   │
│  └─────────────────────┘   │
│                             │
│  ┌─────────────────────┐   │
│  │  ACHIEVEMENTS       │   │
│  │  [Grid] 15/50       │   │
│  └─────────────────────┘   │
│                             │
│  ┌─────────────────────┐   │
│  │  GAME HISTORY       │   │
│  │  [Recent games]     │   │
│  └─────────────────────┘   │
│                             │
│  [LOGOUT]                   │
└─────────────────────────────┘
```

#### 4. Settings Screen (NEW)
**File:** `/home/user/CoinRun/client/src/pages/Settings.tsx`

Layout:
```
┌─────────────────────────────┐
│  ← Back      SETTINGS       │
├─────────────────────────────┤
│  AUDIO:                     │
│  🔊 Master [────●─] 70%     │
│  🎵 Music  [──●───] 50%     │
│  🔔 SFX    [────●─] 80%     │
│                             │
│  GRAPHICS:                  │
│  Quality: [Low][Med][High]  │
│  FPS: [ON] [OFF]            │
│                             │
│  ACCOUNT:                   │
│  Email: user@email.com      │
│  [Delete Account]           │
│                             │
│  LEGAL:                     │
│  [Terms] [Privacy]          │
│                             │
│  Version: 1.0.0             │
│                             │
│  [LOGOUT]                   │
└─────────────────────────────┘
```

#### 5. Missions Screen (NEW)
**File:** `/home/user/CoinRun/client/src/pages/Missions.tsx`

Layout:
```
┌─────────────────────────────┐
│  ← Back      MISSIONS       │
├─────────────────────────────┤
│  [Daily] [Weekly]           │
├─────────────────────────────┤
│  DAILY - Reset in: 5h 23m   │
│                             │
│  ✓ Play 3 Games             │
│    3/3 • 💰 200             │
│    [CLAIM]                  │
│                             │
│  ○ Collect 100 Coins        │
│    47/100 • 💰 150          │
│                             │
│  ○ Reach 30 Soldiers        │
│    0/1 • 💰 300             │
└─────────────────────────────┘
```

#### 6. Shop Screen (Update)
**File:** `/home/user/CoinRun/client/src/pages/Shop.tsx`

Remove:
- USDT purchases
- USDT balance display

Keep:
- Skins (purchase with coins/gems)
- Boosts (purchase with gems)
- Bundles (future feature placeholder)

---

### **PHASE 8: Infinite Upgrade System** 📈

#### Upgrade Cost Formula:
```typescript
function calculateUpgradeCost(upgradeType: string, currentLevel: number): number {
  const baseCosts = {
    speed: 100,
    armyCapacity: 200,
    startingArmy: 500,
    coinValue: 150,
    magnetRadius: 250
  }

  const baseCost = baseCosts[upgradeType]
  return Math.floor(baseCost * Math.pow(1.5, currentLevel))
}
```

Examples:
- Level 1→2: 100 × 1.5¹ = 150 coins
- Level 10→11: 100 × 1.5¹⁰ = 5,767 coins
- Level 20→21: 100 × 1.5²⁰ = 325,779 coins

#### Power Boost Every 10 Levels:
```typescript
function calculateUpgradePower(upgradeType: string, level: number): number {
  const baseEffects = {
    speed: 0.02,        // 2% per level
    armyCapacity: 1,    // +1 soldier per level
    startingArmy: 0.5,  // +0.5 starting soldiers per level
    coinValue: 0.01,    // 1% per level
    magnetRadius: 0.1   // +0.1m per level
  }

  const baseEffect = baseEffects[upgradeType]
  const linearPower = level * baseEffect

  // Multiply by 2 for every 10 levels
  const multiplier = Math.pow(2, Math.floor(level / 10))

  return linearPower * multiplier
}
```

Example at Level 25:
- Linear: 25 × 0.02 = 0.5 (50%)
- Multiplier: 2^2 = 4x (crossed levels 10 and 20)
- Final: 0.5 × 4 = 2.0 (200% speed!)

#### API Implementation:
```typescript
// POST /api/upgrades/purchase
// Body: { upgradeType: 'speed' }

1. Validate user has enough coins
2. Calculate cost: baseCost × (1.5 ^ currentLevel)
3. Deduct coins from user balance
4. Increment upgrade level
5. Save to database
6. Return: { newLevel, newBalance, cost }
```

---

### **PHASE 9: Mission System** 📋

#### Mission Types:
1. **Play X games** - Track gamesPlayed
2. **Collect X coins in single game** - Track coinsCollected per game
3. **Reach X soldiers** - Track maxArmy per game
4. **Complete without hitting obstacles** - New tracking needed
5. **Finish under X seconds** - Track duration

#### Daily Mission Reset:
```typescript
// Run at midnight UTC
async function resetDailyMissions() {
  const missions = await Mission.find({ type: 'daily', active: true })

  await User.updateMany({}, {
    $set: {
      dailyMissions: missions.map(m => ({
        missionId: m._id,
        progress: 0,
        completed: false,
        claimed: false
      })),
      lastDailyReset: new Date()
    }
  })
}
```

#### Mission Claim:
```typescript
// POST /api/missions/claim
// Body: { missionId: string }

1. Validate mission exists and is completed
2. Validate not already claimed
3. Give reward (coins/gems)
4. Mark as claimed
5. Return new balance
```

---

### **PHASE 10: Real-time Data Sync** 🔄

#### Game Flow:
```typescript
1. Start Game:
   POST /api/game/start
   → Server creates game session
   → Returns gameId
   → Client stores gameId

2. Play Game:
   → Client tracks: coins, distance, time, maxArmy
   → No server communication during gameplay

3. Finish Game:
   POST /api/game/finish
   Body: {
     gameId: string
     coinsCollected: number
     distance: number
     duration: number
     maxArmy: number
     finalScore: number
   }

   Server:
   → Validate gameId exists and belongs to user
   → Anti-cheat: Check if values are reasonable
   → Update user coin balance
   → Update user stats (gamesPlayed, bestScore, etc.)
   → Update mission progress
   → Check achievement progress
   → Save game to history
   → Return: {
       newBalance: number
       missions: Mission[]
       achievements: Achievement[]
       rewards: { coins, gems }
     }
```

#### Anti-cheat Validation:
```typescript
function validateGameResults(game: GameResults, user: User): boolean {
  // Max coins per game based on track length
  const maxCoins = TRACK_LENGTH * 2 // Generous estimate
  if (game.coinsCollected > maxCoins) return false

  // Max distance is track length
  if (game.distance > TRACK_LENGTH) return false

  // Minimum time based on player speed
  const minTime = TRACK_LENGTH / (PLAYER_BASE_SPEED * 2) // 2x speed buff
  if (game.duration < minTime) return false

  // Max army based on upgrade level
  const maxArmy = user.upgrades.armyCapacity + 10 // Buffer
  if (game.maxArmy > maxArmy) return false

  return true
}
```

---

### **PHASE 11: Loading & Splash Screens** ⏳

#### App Load Flow:
```typescript
1. Show SplashScreen with logo
2. Check localStorage for JWT token
3. If token exists:
   → Call GET /api/auth/me
   → If valid: Load user data → Navigate to Home
   → If invalid: Clear token → Navigate to Login
4. If no token:
   → Navigate to Login
```

#### Loading States:
```typescript
// Skeleton screens for data loading
<LoadingSkeleton type="home" />      // Home screen skeleton
<LoadingSkeleton type="profile" />   // Profile screen skeleton
<LoadingSkeleton type="missions" />  // Mission list skeleton

// Spinner for actions
<Spinner text="Loading..." />
<Spinner text="Saving..." />

// Progress bar for game load
<ProgressBar
  label="Generating track..."
  progress={75}
/>
```

---

### **PHASE 12: Testing Checklist** ✅

#### Authentication:
- [ ] Cannot access app without login
- [ ] Google OAuth redirects correctly
- [ ] Token stored in localStorage
- [ ] Auto-login works on app reload
- [ ] Logout clears token and redirects to Login
- [ ] Protected routes redirect to Login if no token

#### Game Flow:
- [ ] Can start solo game
- [ ] Coins collected during game
- [ ] Game finish sends data to server
- [ ] Coin balance updates after game
- [ ] Stats update (gamesPlayed, bestScore, etc.)
- [ ] Game saved to history

#### Upgrades:
- [ ] Can purchase upgrade with coins
- [ ] Cost formula correct (1.5^level)
- [ ] Insufficient coins shows error
- [ ] Balance updates after purchase
- [ ] Upgrade level increments
- [ ] Power boost at level 10, 20, 30, etc.

#### Missions:
- [ ] Daily missions visible
- [ ] Progress tracks correctly
- [ ] Can claim completed missions
- [ ] Rewards added to balance
- [ ] Cannot claim twice
- [ ] Missions reset at midnight

#### Shop:
- [ ] Can purchase skin with coins
- [ ] Can purchase boost with gems
- [ ] Owned items tracked
- [ ] Can equip purchased skins
- [ ] No USDT options visible

#### Profile:
- [ ] Stats display correctly
- [ ] Achievements visible
- [ ] Game history shows recent games
- [ ] Logout button works

#### Settings:
- [ ] Volume sliders work
- [ ] Graphics quality changes
- [ ] Settings saved to server
- [ ] Logout works

---

## 🚀 Deployment Steps

### Environment Variables:
```env
# Server (.env)
PORT=4000
MONGODB_URI=mongodb://localhost:27017/coinrun
JWT_SECRET=your-secret-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:4000/api/auth/google/callback
CLIENT_URL=http://localhost:3000

# Client (.env)
VITE_API_URL=http://localhost:4000/api
VITE_WS_URL=http://localhost:4000
```

### Database Migration:
```javascript
// Remove usdtBalance from all users
db.users.updateMany({}, { $unset: { usdtBalance: "" } })

// Remove betting games
db.runnergames.deleteMany({ gameType: "1v1" })

// Remove crypto transactions
db.transactions.deleteMany({ currency: "usdt" })

// Add default settings to all users
db.users.updateMany({}, {
  $set: {
    "settings.masterVolume": 0.7,
    "settings.musicVolume": 0.5,
    "settings.sfxVolume": 0.8,
    "settings.graphicsQuality": "medium",
    "settings.showFPS": true,
    "settings.controlSensitivity": 0.6
  }
})
```

---

## 📁 File Structure After Overhaul

```
/home/user/CoinRun/
├── client/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.tsx           ← NEW
│   │   │   ├── Home.tsx            ← REDESIGN
│   │   │   ├── Game.tsx            ← UPDATE (remove 1v1)
│   │   │   ├── Shop.tsx            ← UPDATE (remove USDT)
│   │   │   ├── Profile.tsx         ← NEW
│   │   │   ├── Settings.tsx        ← NEW
│   │   │   ├── Missions.tsx        ← NEW
│   │   │   └── Leaderboard.tsx     ← KEEP
│   │   ├── components/
│   │   │   ├── SplashScreen.tsx    ← NEW
│   │   │   ├── LoadingSkeleton.tsx ← NEW
│   │   │   └── ui/
│   │   │       ├── PreGame.tsx     ← UPDATE (remove betting)
│   │   │       └── ...
│   │   ├── store/
│   │   │   ├── userStore.ts        ← UPDATE (remove usdt)
│   │   │   └── gameStore.ts        ← UPDATE
│   │   └── services/
│   │       └── api.ts              ← UPDATE (new endpoints)
│   └── ...
├── server/
│   ├── src/
│   │   ├── models/
│   │   │   ├── Users.ts            ← UPDATE (remove usdt, add missions/achievements/settings)
│   │   │   ├── RunnerGame.ts       ← UPDATE (remove betting)
│   │   │   ├── Transactions.ts     ← DELETE or UPDATE
│   │   │   ├── Mission.ts          ← NEW
│   │   │   └── Achievement.ts      ← NEW
│   │   ├── controllers/
│   │   │   ├── authController.ts   ← UPDATE (remove anonymous)
│   │   │   ├── runnerController.ts ← UPDATE (anti-cheat)
│   │   │   ├── upgradeController.ts← UPDATE (infinite formula)
│   │   │   ├── shopController.ts   ← UPDATE (remove USDT)
│   │   │   ├── missionController.ts← NEW
│   │   │   ├── achievementController.ts ← NEW
│   │   │   └── settingsController.ts ← NEW
│   │   ├── routers/
│   │   │   └── mainRoutes.ts       ← UPDATE (remove wallet routes)
│   │   ├── socket/
│   │   │   └── Runner/
│   │   │       └── socket.ts       ← UPDATE (remove betting)
│   │   └── ...
│   └── ...
└── shared/
    └── types/
        ├── game.types.ts           ← UPDATE
        └── mission.types.ts        ← NEW
```

---

## 🎯 Success Criteria

### Cleanup:
✅ No "usdt", "dfns", "web3", "crypto", "wallet" in codebase
✅ No betting mode or 1v1 games
✅ Only Solo mode exists
✅ Only coins and gems (no real money)

### Authentication:
✅ Cannot access app without Google login
✅ Token stored and validated
✅ Auto-login works
✅ Logout redirects to login

### Data Sync:
✅ All user data from MongoDB
✅ Coins update in real-time
✅ Upgrades sync instantly
✅ Mission progress tracks
✅ Game results saved

### UI:
✅ Professional design with GUI Pro assets
✅ Smooth animations (300ms transitions)
✅ Loading states for all data
✅ No blank screens
✅ 60 FPS maintained

### Features:
✅ Infinite upgrades work (1.5^level formula)
✅ Missions track and reset daily/weekly
✅ Shop sells items for coins/gems only
✅ Achievements unlock and track
✅ Settings save and persist

---

## 🔥 Let's Build This! 🚀
