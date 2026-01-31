export const STORAGE_KEYS = {
  USERS: "@pel/users",
  SESSION: "@pel/session",
  STATUSES: (userId: string) => `@pel/statuses:${userId}`,
  HELP: (userId: string) => `@pel/help:${userId}`,
  STUDY_PREFS: (userId: string) => `@pel/studyPrefs:${userId}`,
  REVIEW_PREFS: (userId: string) => `@pel/reviewPrefs:${userId}`,
  PUBLIC_ASSOCIATIONS: "@pel/publicAssociations",
  PRIVATE_ASSOCIATIONS: (userId: string) => `@pel/privateAssociations:${userId}`,
  ASSOCIATION_LIKES: (userId: string) => `@pel/associationLikes:${userId}`,
  ASSOCIATION_SAVES: (userId: string) => `@pel/associationSaves:${userId}`,
};
