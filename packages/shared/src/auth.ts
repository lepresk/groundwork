/**
 * Authentication contracts shared by the API controllers and the web BFF.
 */
import { z } from 'zod';

/** Name of the HttpOnly session cookie issued by the API and relayed by the BFF. */
export const SESSION_COOKIE_NAME = 'groundwork_session';

export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 128;
export const TOTP_CODE_LENGTH = 6;
export const RECOVERY_CODE_COUNT = 10;

export const EmailSchema = z
  .email()
  .max(254)
  .transform((value) => value.trim().toLowerCase());

export const PasswordSchema = z.string().min(PASSWORD_MIN_LENGTH).max(PASSWORD_MAX_LENGTH);

const NameSchema = z.string().trim().min(1).max(100);

const TotpCodeSchema = z
  .string()
  .trim()
  .regex(new RegExp(`^\\d{${String(TOTP_CODE_LENGTH)}}$`), 'Expected a 6-digit code');

const TokenSchema = z.string().min(16).max(256);

export const SignupRequestSchema = z.strictObject({
  email: EmailSchema,
  password: PasswordSchema,
  firstName: NameSchema,
  lastName: NameSchema,
});
export type SignupRequest = z.infer<typeof SignupRequestSchema>;

export const LoginRequestSchema = z.strictObject({
  email: EmailSchema,
  password: z.string().min(1).max(PASSWORD_MAX_LENGTH),
  rememberMe: z.boolean().default(false),
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type LoginRequestInput = z.input<typeof LoginRequestSchema>;

/** Exactly one of `code` (authenticator app) or `recoveryCode` (single use). */
export const TwoFactorLoginRequestSchema = z
  .strictObject({
    code: TotpCodeSchema.optional(),
    recoveryCode: z.string().trim().min(8).max(32).optional(),
  })
  .refine((value) => (value.code === undefined) !== (value.recoveryCode === undefined), {
    message: 'Provide either an authentication code or a recovery code.',
  });
export type TwoFactorLoginRequest = z.infer<typeof TwoFactorLoginRequestSchema>;

export const EmailRequestSchema = z.strictObject({ email: EmailSchema });
export type EmailRequest = z.infer<typeof EmailRequestSchema>;

export const VerifyEmailRequestSchema = z.strictObject({ token: TokenSchema });
export type VerifyEmailRequest = z.infer<typeof VerifyEmailRequestSchema>;

export const ResetPasswordRequestSchema = z.strictObject({
  token: TokenSchema,
  password: PasswordSchema,
});
export type ResetPasswordRequest = z.infer<typeof ResetPasswordRequestSchema>;

export const UserProfileSchema = z.strictObject({
  id: z.uuid(),
  email: z.email(),
  firstName: z.string(),
  lastName: z.string(),
  emailVerifiedAt: z.iso.datetime(),
  twoFactorEnabled: z.boolean(),
  createdAt: z.iso.datetime(),
});
export type UserProfile = z.infer<typeof UserProfileSchema>;

export const SignupResponseSchema = z.strictObject({
  status: z.literal('verification_required'),
});
export type SignupResponse = z.infer<typeof SignupResponseSchema>;

export const LoginResponseSchema = z.discriminatedUnion('status', [
  z.strictObject({ status: z.literal('authenticated'), user: UserProfileSchema }),
  z.strictObject({ status: z.literal('two_factor_required') }),
]);
export type LoginResponse = z.infer<typeof LoginResponseSchema>;

export const AuthenticatedResponseSchema = z.strictObject({
  status: z.literal('authenticated'),
  user: UserProfileSchema,
});
export type AuthenticatedResponse = z.infer<typeof AuthenticatedResponseSchema>;

export const TwoFactorSetupResponseSchema = z.strictObject({
  secret: z.string(),
  otpauthUrl: z.string(),
});
export type TwoFactorSetupResponse = z.infer<typeof TwoFactorSetupResponseSchema>;

export const TwoFactorCodeRequestSchema = z.strictObject({ code: TotpCodeSchema });
export type TwoFactorCodeRequest = z.infer<typeof TwoFactorCodeRequestSchema>;

export const TwoFactorEnableResponseSchema = z.strictObject({
  recoveryCodes: z.array(z.string()).length(RECOVERY_CODE_COUNT),
});
export type TwoFactorEnableResponse = z.infer<typeof TwoFactorEnableResponseSchema>;

export const TwoFactorDisableRequestSchema = z.strictObject({
  password: z.string().min(1).max(PASSWORD_MAX_LENGTH),
  code: TotpCodeSchema,
});
export type TwoFactorDisableRequest = z.infer<typeof TwoFactorDisableRequestSchema>;
