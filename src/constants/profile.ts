/** Profile field limits; the database enforces the same (0011_profile_editing.sql). */
export const PROFILE_LIMITS = {
  name: 40,
  homeCity: 60,
  bio: 160,
} as const;
