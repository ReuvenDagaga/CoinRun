# Frontend Refactoring Rules - Conservative Approach

## 🎯 Core Principles

### 1. **One Component Per File** (קומפוננטה אחת לקובץ)
- ✅ כל קובץ מכיל **קומפוננטה אחת בלבד**
- ✅ אם יש קומפוננטה עזר קטנה מאוד (<10 שורות), היא יכולה להישאר באותו קובץ
- ❌ אין יותר מ-2 exports של קומפוננטות מאותו קובץ

### 2. **Maximum File Size** (גודל קובץ מקסימלי)
```
- Utils/Helpers: max 200 lines
- Hooks: max 150 lines
- Components: max 150 lines
- Pages: max 100 lines (composition only!)
- Contexts: max 100 lines (split to multiple files)
```

### 3. **Separation of Concerns** (הפרדת אחריות)
```
UI Components (presentation)
    ↓ use
Hooks (business logic)
    ↓ use
Utils (pure functions)
    ↓ use
Constants (configuration)
```

### 4. **Single Responsibility** (אחריות יחידה)
- כל פונקציה עושה **דבר אחד**
- כל hook מנהל **היבט אחד** של state/logic
- כל component מציג **דבר אחד**

---

## 📁 File Naming Conventions

### Components
```typescript
// UI Component
Button.tsx                  // PascalCase
IconButton.tsx             // PascalCase
FloatingNavButton.tsx      // PascalCase

// Feature Component
UpgradeCard.tsx            // PascalCase
PlayerCharacter.tsx        // PascalCase
```

### Hooks
```typescript
// Custom hook - always starts with "use"
useAuth.ts                 // useCamelCase
usePlayerMovement.ts       // useCamelCase
useSwipeDetector.ts        // useCamelCase
```

### Utils
```typescript
// Utility function/module - always ends with .util.ts
audioManager.util.ts       // camelCase.util.ts
textShadow.util.ts         // camelCase.util.ts
tokenValidator.util.ts     // camelCase.util.ts
```

### Constants
```typescript
// Constants - always ends with .constants.ts
client.constants.ts        // camelCase.constants.ts
colors.constants.ts        // camelCase.constants.ts
achievements.constants.ts  // camelCase.constants.ts
```

### Types
```typescript
// TypeScript types - always ends with .types.ts
player.types.ts           // camelCase.types.ts
weapon.types.ts           // camelCase.types.ts
game.types.ts             // camelCase.types.ts
```

### Config
```typescript
// Configuration - always ends with .config.ts
track.config.ts           // camelCase.config.ts
shop.config.ts            // camelCase.config.ts
```

---

## 🏗️ Folder Structure Rules

### 1. **Feature-Based Organization** (ארגון לפי פיצ'רים)
```
features/
├── game/              # All game-related code
│   ├── components/
│   ├── hooks/
│   ├── types/
│   └── utils/
├── profile/           # All profile-related code
│   ├── components/
│   ├── hooks/
│   └── types/
└── shop/              # All shop-related code
    ├── components/
    ├── hooks/
    └── types/
```

**Rule**: כל פיצ'ר הוא עצמאי ויכול להכיל:
- `components/` - UI components
- `hooks/` - Business logic hooks
- `types/` - TypeScript types
- `utils/` - Feature-specific utilities
- `constants/` - Feature-specific constants
- `config/` - Feature configuration

### 2. **Shared Code** (קוד משותף)
```
shared/
├── ui/                # Reusable UI components
│   ├── buttons/
│   ├── loading/
│   └── feedback/
├── 3d/                # Reusable 3D components
└── icons/             # Icon components
```

**Rule**: רק קוד שמשותף ל-2+ פיצ'רים שונים

### 3. **Core/Infrastructure** (תשתית)
```
core/
├── state/             # Global state management
│   └── contexts/
├── services/          # API & external services
│   ├── api/
│   ├── auth/
│   └── socket/
└── types/             # Global types
```

**Rule**: קוד תשתית שהכל תלוי בו

### 4. **Library Code** (ספרייה)
```
lib/
├── hooks/             # Reusable hooks
│   ├── common/        # Generic hooks
│   └── game/          # Game-specific hooks
├── utils/             # Utility functions
│   ├── input/
│   ├── audio/
│   └── validation/
└── constants/         # Global constants
```

**Rule**: קוד generic שאפשר להשתמש בו בכל מקום

---

## 📝 Export/Import Rules

### 1. **Barrel Exports** (index.ts files)
```typescript
// ✅ Good - every folder has index.ts
features/game/components/index.ts
lib/hooks/index.ts
shared/ui/buttons/index.ts

// index.ts content
export { Button } from './Button';
export { IconButton } from './IconButton';
```

### 2. **Import Paths**
```typescript
// ✅ Good - use barrel exports
import { Button } from '@/shared/ui/buttons';
import { useAuth } from '@/core/state/contexts';
import { CLIENT_CONSTANTS } from '@/lib/constants';

// ❌ Bad - direct file imports
import { Button } from '@/shared/ui/buttons/Button';
```

### 3. **Default vs Named Exports**
```typescript
// ✅ Components - default export
export default function Button() { }

// ✅ Hooks/Utils - named export
export function useAuth() { }
export const formatCurrency = () => { }

// ✅ Constants - named export
export const COLORS = { };
```

---

## 🔄 Component Splitting Rules

### When to Split a Component

**Split if ANY of these is true:**
1. ✅ File > 150 lines
2. ✅ Multiple responsibilities (rendering + logic)
3. ✅ Has helper components defined inside
4. ✅ Has complex state management (>3 useState)
5. ✅ Has multiple useEffect hooks (>2)

### How to Split

#### Before (Bad):
```typescript
// Profile.tsx - 259 lines, 4 components
export default function Profile() {
  return (
    <div>
      <ProfileHeader />
      <StatsSection />
      <DailyRewards />
      <Achievements />
    </div>
  );
}

function ProfileHeader() { /* 50 lines */ }
function StatsSection() { /* 80 lines */ }
function DailyRewards() { /* 100 lines */ }
function Achievements() { /* 80 lines */ }
```

#### After (Good):
```typescript
// ProfilePage.tsx - 30 lines (composition only)
import { ProfileHeader } from './components/ProfileHeader';
import { StatsSection } from './components/StatsSection';
import { DailyRewards } from './components/DailyRewards';
import { Achievements } from './components/Achievements';

export default function ProfilePage() {
  return (
    <div>
      <ProfileHeader />
      <StatsSection />
      <DailyRewards />
      <Achievements />
    </div>
  );
}

// components/ProfileHeader.tsx - 50 lines
export function ProfileHeader() { /* ... */ }

// components/StatsSection.tsx - 80 lines
export function StatsSection() { /* ... */ }

// etc.
```

---

## 🎣 Hook Extraction Rules

### When to Extract a Hook

**Extract if ANY is true:**
1. ✅ Business logic in component (calculations, API calls)
2. ✅ Complex state management
3. ✅ Reusable logic (used in 2+ places)
4. ✅ Side effects management (useEffect)

### Examples

#### Before (Bad):
```typescript
function UpgradeCard() {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async (type) => {
    setLoading(true);
    await purchaseUpgrade(type);
    setLoading(false);
  };

  return <button onClick={() => handleUpgrade('speed')}>Upgrade</button>;
}
```

#### After (Good):
```typescript
// Component - presentation only
function UpgradeCard() {
  const { handleUpgrade, loading } = useUpgrade();

  return <button onClick={() => handleUpgrade('speed')}>Upgrade</button>;
}

// hooks/useUpgrade.ts - business logic
export function useUpgrade() {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async (type: string) => {
    setLoading(true);
    await purchaseUpgrade(type);
    setLoading(false);
  };

  return { handleUpgrade, loading };
}
```

---

## 📦 Module Organization

### Small Modules (< 5 files)
```
buttons/
├── Button.tsx
├── IconButton.tsx
├── FloatingNavButton.tsx
└── index.ts
```

### Medium Modules (5-15 files)
```
game/
├── components/
│   ├── GameCanvas.tsx
│   ├── GameWorld.tsx
│   └── index.ts
├── hooks/
│   ├── useGameLoop.ts
│   ├── useGameState.ts
│   └── index.ts
└── index.ts
```

### Large Modules (15+ files)
```
game/
├── player/
│   ├── components/
│   ├── hooks/
│   ├── types/
│   └── index.ts
├── track/
│   ├── components/
│   ├── hooks/
│   ├── types/
│   └── index.ts
└── index.ts
```

**Rule**: תת-מודולים כשיש יותר מ-15 קבצים

---

## 🧪 Testing Strategy (for each phase)

### After Each Refactoring Phase:

1. ✅ **Compile Check**
```bash
npm run build
```

2. ✅ **Import Check**
```bash
# Check for broken imports
grep -r "from '@/" --include="*.tsx" --include="*.ts" | grep "ERROR"
```

3. ✅ **Manual Test**
- Navigate to affected pages
- Test affected functionality
- Check console for errors

4. ✅ **Git Commit**
```bash
git add .
git commit -m "refactor: [phase name] - [what changed]"
```

---

## 📊 Refactoring Phases (Conservative)

### Phase 1: Constants (Low Risk)
- [x] Split constants into 5 files
- [ ] Create barrel export
- [ ] Update imports
- [ ] Test & commit

### Phase 2: Utils (Low Risk)
- [ ] Organize utils by category
- [ ] Create barrel exports
- [ ] Update imports
- [ ] Test & commit

### Phase 3: Hooks (Medium Risk)
- [ ] Extract hooks from utils
- [ ] Create hook barrel exports
- [ ] Update imports
- [ ] Test & commit

### Phase 4: Services (Low Risk)
- [ ] Reorganize services
- [ ] Create barrel exports
- [ ] Update imports
- [ ] Test & commit

### Phase 5: Icons (Low Risk)
- [ ] Split icons into individual files
- [ ] Create barrel export
- [ ] Update imports
- [ ] Test & commit

### Phase 6: Small Components (Medium Risk)
- [ ] Split components with multiple exports
- [ ] Keep in same location initially
- [ ] Update imports
- [ ] Test & commit

### Phase 7: Large Components (High Risk)
- [ ] Extract hooks from large components
- [ ] Split into smaller components
- [ ] Update imports
- [ ] Test thoroughly & commit

### Phase 8: Feature Organization (High Risk)
- [ ] Move to feature-based structure
- [ ] Update all imports
- [ ] Test thoroughly & commit

---

## ✅ Success Criteria

After complete refactoring:

- [ ] No file > 150 lines (except configs)
- [ ] No file with 2+ component exports
- [ ] All business logic in hooks
- [ ] All imports use barrel exports
- [ ] Feature-based organization
- [ ] All tests passing
- [ ] No console errors
- [ ] App works as before

---

## 🚫 What NOT to Do

1. ❌ Don't refactor multiple phases at once
2. ❌ Don't change functionality while refactoring
3. ❌ Don't skip testing between phases
4. ❌ Don't commit without testing
5. ❌ Don't create circular dependencies
6. ❌ Don't over-engineer simple components
7. ❌ Don't create hooks for simple logic
8. ❌ Don't split files just to split them

---

## 🎓 Decision Guide

### Should I extract a hook?
```
Does this logic have state? → YES → Extract hook
Is it used in 2+ components? → YES → Extract hook
Is it >30 lines? → YES → Extract hook
Is it simple calculation? → NO → Keep in component
```

### Should I split a component?
```
Is file >150 lines? → YES → Split
Does it have helper components? → YES → Split
Does it mix UI + logic? → YES → Split logic to hook first
Is it just long JSX? → MAYBE → Consider splitting UI only
```

### Should I create a new folder?
```
Related files >5? → YES → Create folder
Related files <5? → NO → Keep flat
Needs sub-modules? → YES → Create nested folders
```

---

## 📝 Commit Message Format

```
refactor(scope): description

- Detail 1
- Detail 2

Phase: [phase number/name]
Risk: [low/medium/high]
Tested: [yes/no]
```

Example:
```
refactor(constants): split into 5 separate files

- Split CLIENT_CONSTANTS, COLORS, SKINS, ACHIEVEMENTS, MISSIONS
- Created barrel export in lib/constants/index.ts
- Updated all imports to use new structure

Phase: Phase 1 - Constants
Risk: low
Tested: yes
```

---

## 🎯 Current Focus

**Phase 1: Constants** ← WE ARE HERE
- Conservative, low-risk
- Easy to test
- Foundation for rest of refactoring
