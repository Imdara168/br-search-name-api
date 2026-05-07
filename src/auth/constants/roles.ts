export const USER_ROLES = {
  ADMIN: 'admin',
  SEARCH_ONLY: 'search_only',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];
