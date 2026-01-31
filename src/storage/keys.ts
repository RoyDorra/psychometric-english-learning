export const STORAGE_KEYS = {
  USERS: "@pel/users",
  SESSION: "@pel/session",
  STATUSES: (userId: string) => `@pel/statuses:${userId}`,
  HELP: (userId: string) => `@pel/help:${userId}`,
  STUDY_PREFS: (userId: string) => `@pel/studyPrefs:${userId}`,
  REVIEW_PREFS: (userId: string) => `@pel/reviewPrefs:${userId}`,
  ASSOCIATIONS: "@pel/associations",
  ASSOCIATION_VOTES: (userId: string) => `@pel/associationVotes:${userId}`,
  LAST_SYNC: "@pel/lastSync",
};
