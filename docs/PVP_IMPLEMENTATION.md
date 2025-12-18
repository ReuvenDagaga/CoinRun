# CoinRun 1v1 PvP Implementation Guide

## Overview
This document describes the complete 1v1 PvP multiplayer system for CoinRun, implemented using Socket.IO with authoritative server architecture.

## Architecture

### Tech Stack
- **Server**: Node.js + Express + Socket.IO (TypeScript)
- **Client**: React + Three.js + Socket.IO Client (TypeScript)
- **Database**: MongoDB (for user data and stats)
- **Communication**: WebSocket (Socket.IO)

### Key Design Patterns
- **Authoritative Server**: Server validates all game state
- **Client Prediction**: Clients predict their own movements for responsiveness
- **Opponent Interpolation**: Smooth opponent rendering with 66ms delay
- **Deterministic Track Generation**: Seeded random for identical tracks

## Phase 1: Infrastructure ✅

### 1.1 Socket.IO Setup
**Files Created:**
- `server/src/socket/PvP/socketManager.ts` - Main PvP socket handler
- `client/src/services/pvpSocket.ts` - Client socket service
- `shared/types/pvp.types.ts` - Shared TypeScript types

**Features:**
- `/pvp` namespace for PvP-specific events
- Automatic reconnection (10 attempts)
- Heartbeat mechanism (5 sec intervals)
- Token-based authentication

### 1.2 Game Room Manager
**Files Created:**
- `server/src/socket/PvP/RoomManager.ts` - Room lifecycle management

**Features:**
- Room states: WAITING, COUNTDOWN, PLAYING, PAUSED, FINISHED
- Auto-cleanup after 10 minutes of inactivity
- Player-to-room mapping
- Thread-safe room operations

### 1.3 Matchmaking Queue
**Files Created:**
- `server/src/socket/PvP/matchmakingService.ts` - Power-level based matchmaking

**Features:**
- Power level matching (±20% initially, ±40% after 30s)
- 60-second timeout
- Automatic queue removal on disconnect
- Skin conflict resolution

### 1.4 Server-Side Track Generation
**Files Created:**
- `shared/utils/seededRandom.ts` - Mulberry32 PRNG
- `shared/utils/trackGenerator.ts` - Deterministic track generation

**Features:**
- Identical tracks on server and both clients
- Configurable difficulty and length
- Track validation for synchronization

## Phase 2: Core Multiplayer ✅

### 2.1 Server Game Loop
**Files Created:**
- `server/src/socket/PvP/GameLoop.ts` - 30 Hz authoritative game loop

**Features:**
- 30 ticks per second (33ms intervals)
- Input processing and validation
- Collision detection (server-side)
- State broadcasting to clients
- Win condition checking

### 2.2 Client Input Handler
**Files Created:**
- `client/src/multiplayer/InputHandler.ts` - Input capture with prediction

**Features:**
- Instant local feedback (client prediction)
- Server reconciliation
- Sequence number tracking
- Input buffering (last 60 inputs)

### 2.3 Opponent Interpolation
**Files Created:**
- `client/src/multiplayer/EntityInterpolation.ts` - State interpolation

**Features:**
- 66ms interpolation delay (2 ticks)
- State buffer (last 10 states)
- Dead reckoning for packet loss
- Smooth position corrections

### 2.4 Opponent Renderer
**Files Created:**
- `client/src/components/OpponentCharacter.tsx` - Opponent visualization

**Features:**
- 50% transparency
- Subtle glow effect
- Smooth lane transitions
- Visibility based on alive state

## Phase 3: Game Flow & UI ✅

### 3.1 Pre-Game Lobby Screen
**Files Created:**
- `client/src/pages/PvPLobbyScreen.tsx` - Matchmaking UI

**Features:**
- Searching animation
- Match found display
- 3-2-1-GO countdown
- Player info cards

### 3.2 In-Game PvP HUD
**Files Created:**
- `client/src/components/PvPHUD.tsx` - Real-time match overlay

**Features:**
- Soldier count displays (animated on change)
- Match timer
- Dual-progress bar
- Connection quality indicator

### 3.3 Disconnection Handling
**Files Created:**
- `client/src/components/DisconnectionOverlay.tsx` - Disconnect UI
- Server: Pause/resume logic in GameLoop

**Features:**
- 30-second reconnection window
- Game pause during disconnect
- 3-second resume countdown
- Forfeit on timeout

### 3.4 Results Screen
**Files Created:**
- `client/src/pages/PvPResultsScreen.tsx` - Post-match results

**Features:**
- Winner announcement with confetti
- Score breakdown (soldiers + time bonus)
- Reward animation
- Play again / Main menu buttons

## Phase 4: Economy & Security ✅

### 4.1 Entry Fee & Coin Hold System
**Files Created:**
- `server/src/services/CoinHoldService.ts` - Coin transaction management
- Updated: `server/src/models/Users.ts` - Added `heldCoins` field
- Updated: `shared/interface/IUser.ts` - Added `heldCoins` to interface

**Features:**
- 1,000 coin entry fee
- Hold mechanism (deduct → hold → release/convert)
- Prevents double-spending
- Automatic refund on timeout/cancel

### 4.2 Scoring System
**Files Created:**
- `server/src/services/ScoringService.ts` - Score calculation

**Formula:**
```
score = (soldiers × 10) + ((maxTime - completionTime) × 5)
maxTime = (trackLength / 1000) × 30 seconds
```

**Win Conditions:**
1. OPPONENT_DIED - One player died
2. HIGHER_SCORE - Higher total score
3. FASTER_TIME - Tie-breaker for equal scores
4. FORFEIT - Disconnection timeout
5. DRAW - Perfect tie (extremely rare)

### 4.3 Anti-Cheat Validation
**Files Created:**
- `server/src/services/AntiCheatService.ts` - Server-side validation

**Features:**
- Movement speed validation (max 20 units/sec)
- Position teleportation detection
- Completion time validation
- Input rate limiting (10/sec max)
- Cheat score calculation
- Suspicious activity logging

### 4.4 Skin Conflict Resolution
**Implementation:** Integrated in `matchmakingService.ts`

**Features:**
- Automatic skin change for player 2 if conflict
- Temporary change (match-only)
- Notification to affected player

## Rewards Distribution
**Files Created:**
- `server/src/services/RewardService.ts` - Reward calculation and distribution

### Payout Structure
| Outcome | Coins | Gems |
|---------|-------|------|
| Winner  | +1,950 | +10 |
| Loser   | -1,000 | +1  |
| Draw    | Refund | +1 (both) |

**Statistics Tracking:**
- `gamesPlayed` (incremented for both)
- `gamesWon` (incremented for winner)

## Socket Events Reference

### Matchmaking Events
| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `matchmaking:join` | C → S | `{}` | Join queue |
| `matchmaking:cancel` | C → S | `{}` | Leave queue |
| `matchmaking:searching` | S → C | `{ powerLevel }` | Search started |
| `matchmaking:found` | S → C | `MatchFoundPayload` | Match found |
| `matchmaking:timeout` | S → C | `{}` | No match (60s) |
| `matchmaking:canceled` | S → C | `{}` | Queue canceled |

### Game Events
| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `game:ready` | C → S | `{ roomId }` | Player loaded |
| `game:ready_ack` | S → C | `{ roomId }` | Ready confirmed |
| `game:countdown` | S → C | `{ seconds }` | Pre-game countdown |
| `game:start` | S → C | `{ roomId, timestamp }` | Game begins |
| `game:input` | C → S | `{ roomId, input: InputPacket }` | Player input |
| `game:state` | S → C | `GameStatePacket` | State update (30/sec) |
| `game:player_input` | S → C | `{ userId, input }` | Opponent input |
| `game:player_finished` | S → C | `{ userId, time, soldiers }` | Player finished |
| `game:player_died` | S → C | `{ userId }` | Player died |
| `game:paused` | S → C | `{ userId, reason }` | Game paused |
| `game:resumed` | S → C | `{ seconds }` | Resume countdown |
| `game:finished` | S → C | `GameResult` | Match ended |

## File Structure

```
CoinRun/
├── server/src/
│   ├── socket/PvP/
│   │   ├── socketManager.ts         # Main socket handler
│   │   ├── RoomManager.ts          # Room lifecycle
│   │   ├── matchmakingService.ts   # Matchmaking logic
│   │   └── GameLoop.ts             # Game simulation
│   ├── services/
│   │   ├── CoinHoldService.ts      # Entry fee management
│   │   ├── ScoringService.ts       # Score calculation
│   │   ├── RewardService.ts        # Reward distribution
│   │   └── AntiCheatService.ts     # Cheat detection
│   └── models/
│       └── Users.ts                # Updated with heldCoins
├── client/src/
│   ├── services/
│   │   └── pvpSocket.ts            # Socket.IO client
│   ├── multiplayer/
│   │   ├── InputHandler.ts         # Client prediction
│   │   └── EntityInterpolation.ts  # Opponent interpolation
│   ├── components/
│   │   ├── OpponentCharacter.tsx   # Opponent renderer
│   │   ├── PvPHUD.tsx             # In-game HUD
│   │   └── DisconnectionOverlay.tsx # Disconnect UI
│   └── pages/
│       ├── PvPLobbyScreen.tsx      # Matchmaking lobby
│       └── PvPResultsScreen.tsx    # Post-match results
└── shared/
    ├── types/
    │   └── pvp.types.ts            # Shared types
    ├── utils/
    │   ├── seededRandom.ts         # PRNG
    │   └── trackGenerator.ts       # Track generation
    └── interface/
        └── IUser.ts                # Updated user interface
```

## Next Steps for Integration

### 1. Database Migration
Run migration to add `heldCoins` field to existing users:
```javascript
db.users.updateMany({}, { $set: { heldCoins: 0 } })
```

### 2. Client Routes
Add PvP routes to React Router:
```typescript
<Route path="/pvp/lobby" element={<PvPLobbyScreen />} />
<Route path="/pvp/game/:roomId" element={<PvPGameScreen />} />
<Route path="/pvp/results/:roomId" element={<PvPResultsScreen />} />
```

### 3. Environment Variables
Add to `.env`:
```
VITE_SOCKET_URL=http://localhost:3000  # Client
```

### 4. Testing Checklist
- [ ] Two players can match successfully
- [ ] Track generates identically on both clients
- [ ] Game loop runs at 30 Hz
- [ ] Opponent movement is smooth
- [ ] Disconnection/reconnection works
- [ ] Scoring calculates correctly
- [ ] Rewards distribute properly
- [ ] Anti-cheat detects impossible movements
- [ ] Coin holds prevent double-spending

## Performance Considerations

### Server
- Game loop: 33ms ticks (30 FPS)
- State broadcast: ~2KB per tick
- Expected load: 50 concurrent matches = 1500 ticks/sec

### Client
- Interpolation buffer: 10 states × 2 players = ~1KB
- Network: ~60 KB/s per client (receive state @ 30 Hz)

### Optimizations
- Only broadcast changed state (delta compression possible)
- Batch multiple rooms in single broadcast
- Use binary protocol (MessagePack) for state (optional)

## Security Notes

1. **Entry Fee**: Held in separate field to prevent race conditions
2. **Server Authority**: All collision detection server-side
3. **Anti-Cheat**: Movement validation, rate limiting, score verification
4. **No Crypto**: Virtual currencies only (coins/gems)

## Known Limitations

1. **Track Generation**: Limited obstacle variety (can be extended)
2. **Reconnection**: 30-second window only
3. **Spectating**: Not implemented (future feature)
4. **Replay System**: Not implemented (future feature)
5. **Tournaments**: Not implemented (future feature)

## Conclusion

The PvP system is **fully implemented** across all 4 phases. All major components are in place:
- ✅ Real-time multiplayer infrastructure
- ✅ Matchmaking with power-level balancing
- ✅ Authoritative server game loop
- ✅ Client prediction and interpolation
- ✅ Complete UI flow (lobby → game → results)
- ✅ Economy system with anti-cheat
- ✅ Rewards and statistics tracking

The system is ready for integration testing and deployment.
