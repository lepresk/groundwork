/**
 * Authentication feature: session cookies, the server-side session
 * registry, email verification, password reset, and TOTP two-factor.
 *
 * Exports `SessionGuard` and its dependencies so any feature module can
 * protect its routes with `@Authenticated()`.
 */
import { Module } from '@nestjs/common';
import { CompleteTwoFactorLoginAction } from './actions/complete-two-factor-login.action.js';
import { DisableTwoFactorAction } from './actions/disable-two-factor.action.js';
import { EnableTwoFactorAction } from './actions/enable-two-factor.action.js';
import { GetCurrentUserAction } from './actions/get-current-user.action.js';
import { LoginAction } from './actions/login.action.js';
import { LogoutAction } from './actions/logout.action.js';
import { RequestPasswordResetAction } from './actions/request-password-reset.action.js';
import { ResendVerificationAction } from './actions/resend-verification.action.js';
import { ResetPasswordAction } from './actions/reset-password.action.js';
import { SignupAction } from './actions/signup.action.js';
import { StartTwoFactorSetupAction } from './actions/start-two-factor-setup.action.js';
import { VerifyEmailAction } from './actions/verify-email.action.js';
import { AuthController } from './auth.controller.js';
import { AuthSessionsRepository } from './repositories/auth-sessions.repository.js';
import { AuthTokensRepository } from './repositories/auth-tokens.repository.js';
import { TwoFactorRepository } from './repositories/two-factor.repository.js';
import { UsersRepository } from './repositories/users.repository.js';
import { AuthEmails } from './services/auth-emails.service.js';
import { PasswordHasher } from './services/password-hasher.service.js';
import { SessionIssuer } from './services/session-issuer.service.js';
import { TotpService } from './services/totp.service.js';
import { SessionCookieService } from './session/session-cookie.service.js';
import { SessionGuard } from './session/session.guard.js';
import { TwoFactorController } from './two-factor.controller.js';

@Module({
  controllers: [AuthController, TwoFactorController],
  providers: [
    AuthSessionsRepository,
    AuthTokensRepository,
    TwoFactorRepository,
    UsersRepository,
    AuthEmails,
    PasswordHasher,
    SessionIssuer,
    TotpService,
    SessionCookieService,
    SessionGuard,
    SignupAction,
    VerifyEmailAction,
    ResendVerificationAction,
    LoginAction,
    CompleteTwoFactorLoginAction,
    LogoutAction,
    RequestPasswordResetAction,
    ResetPasswordAction,
    GetCurrentUserAction,
    StartTwoFactorSetupAction,
    EnableTwoFactorAction,
    DisableTwoFactorAction,
  ],
  exports: [SessionGuard, SessionCookieService, AuthSessionsRepository],
})
export class AuthModule {}
