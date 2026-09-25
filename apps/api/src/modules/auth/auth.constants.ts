/**
 * Lifetimes of every credential issued by the auth module.
 */
export const SESSION_IDLE_TTL_MS = 12 * 60 * 60 * 1000;
export const SESSION_REMEMBER_TTL_MS = 30 * 24 * 60 * 60 * 1000;
/** Minimum interval between two `last_activity_at` writes for one session. */
export const SESSION_ACTIVITY_WRITE_INTERVAL_MS = 60 * 1000;
export const TWO_FACTOR_CHALLENGE_TTL_MS = 10 * 60 * 1000;
export const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
export const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;
export const TOTP_ISSUER = 'Groundwork';
