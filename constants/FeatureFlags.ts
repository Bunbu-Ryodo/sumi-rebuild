// TEMPORARY FEATURE FLAGS
// ------------------------------------------------------------------
// BYPASS_PAYWALL: when true, every premium gate in the app is unlocked
// for all users. The RevenueCat entitlement checks (and all paywall
// UI/logic) are left fully intact — they are simply short-circuited by
// this flag. Set it back to false to restore all paywalls exactly as
// they were. Used in:
//   - app/(tabs)/artworks.tsx   (saved artworks & quotes library)
//   - app/leaderboards.tsx      (leaderboard)
//   - app/ereader/[id].tsx      (AI assists, explanatory notes, Grade)
//   - app/(tabs)/settings.tsx   (Upgrade/Manage premium buttons)
// ------------------------------------------------------------------
export const BYPASS_PAYWALL = true;
