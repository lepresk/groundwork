/**
 * Public authentication endpoints: signup, email verification, login
 * (with optional two-factor step), logout, and password reset.
 *
 * Controllers stay thin: parse input (DTOs), call one action, translate a
 * failed result into a DomainException, and shape the response.
 */
import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { LoginResponse } from '@groundwork/shared';
import type { Request, Response } from 'express';
import { ZodResponse } from 'nestjs-zod';
import { ApiErrors } from '../../shared/errors/api-errors.decorator.js';
import { DomainException } from '../../shared/errors/domain-exception.js';
import { resolveClientContext } from '../../shared/http/client-context.js';
import { AuthThrottle } from '../../shared/throttling/auth-throttle.decorator.js';
import { CompleteTwoFactorLoginAction } from './actions/complete-two-factor-login.action.js';
import { GetCurrentUserAction } from './actions/get-current-user.action.js';
import { LoginAction } from './actions/login.action.js';
import { LogoutAction } from './actions/logout.action.js';
import { RequestPasswordResetAction } from './actions/request-password-reset.action.js';
import { ResendVerificationAction } from './actions/resend-verification.action.js';
import { ResetPasswordAction } from './actions/reset-password.action.js';
import { SignupAction } from './actions/signup.action.js';
import { VerifyEmailAction } from './actions/verify-email.action.js';
import {
  AuthenticatedResponseDto,
  EmailRequestDto,
  LoginRequestDto,
  LoginResponseDto,
  ResetPasswordRequestDto,
  SignupRequestDto,
  SignupResponseDto,
  TwoFactorLoginRequestDto,
  UserProfileDto,
  VerifyEmailRequestDto,
} from './auth.schemas.js';
import { Authenticated } from './session/authenticated.decorator.js';
import { CurrentSession } from './session/current-session.decorator.js';
import { SessionCookieService } from './session/session-cookie.service.js';
import type { AuthenticatedSession } from './session/session.types.js';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly cookies: SessionCookieService,
    private readonly signupAction: SignupAction,
    private readonly verifyEmailAction: VerifyEmailAction,
    private readonly resendVerificationAction: ResendVerificationAction,
    private readonly loginAction: LoginAction,
    private readonly completeTwoFactorLoginAction: CompleteTwoFactorLoginAction,
    private readonly logoutAction: LogoutAction,
    private readonly requestPasswordResetAction: RequestPasswordResetAction,
    private readonly resetPasswordAction: ResetPasswordAction,
    private readonly getCurrentUserAction: GetCurrentUserAction,
  ) {}

  @Post('signup')
  @AuthThrottle()
  @ZodResponse({ status: HttpStatus.CREATED, type: SignupResponseDto })
  @ApiErrors('auth.email_already_registered', 'generic.rate_limited')
  async signup(@Body() body: SignupRequestDto): Promise<SignupResponseDto> {
    const result = await this.signupAction.execute(body);
    if (!result.ok) {
      throw new DomainException(result.error);
    }
    return { status: 'verification_required' };
  }

  @Post('email/verify')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiErrors('auth.verification_token_invalid')
  async verifyEmail(@Body() body: VerifyEmailRequestDto): Promise<void> {
    const result = await this.verifyEmailAction.execute(body.token);
    if (!result.ok) {
      throw new DomainException(result.error);
    }
  }

  @Post('email/resend')
  @HttpCode(HttpStatus.ACCEPTED)
  @AuthThrottle()
  @ApiErrors('generic.rate_limited')
  async resendVerification(@Body() body: EmailRequestDto): Promise<void> {
    await this.resendVerificationAction.execute(body.email);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @AuthThrottle()
  @ZodResponse({ status: HttpStatus.OK, type: LoginResponseDto })
  @ApiErrors('auth.invalid_credentials', 'auth.email_not_verified', 'generic.rate_limited')
  async login(
    @Body() body: LoginRequestDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponse> {
    const result = await this.loginAction.execute(body, resolveClientContext(req));
    if (!result.ok) {
      throw new DomainException(result.error);
    }

    const outcome = result.value;
    if (outcome.kind === 'two_factor_required') {
      await this.cookies.issueTwoFactorChallenge(req, res, outcome.challenge);
      return { status: 'two_factor_required' };
    }
    await this.cookies.issueSession(
      req,
      res,
      { sessionId: outcome.sessionId, userId: outcome.user.id },
      outcome.rememberMe,
    );
    return { status: 'authenticated', user: outcome.user };
  }

  @Post('login/two-factor')
  @HttpCode(HttpStatus.OK)
  @AuthThrottle()
  @ZodResponse({ status: HttpStatus.OK, type: AuthenticatedResponseDto })
  @ApiErrors('auth.two_factor_challenge_missing', 'auth.two_factor_code_invalid')
  async completeTwoFactorLogin(
    @Body() body: TwoFactorLoginRequestDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthenticatedResponseDto> {
    const { twoFactorChallenge } = await this.cookies.read(req, res);
    const result = await this.completeTwoFactorLoginAction.execute(
      twoFactorChallenge,
      body,
      resolveClientContext(req),
    );
    if (!result.ok) {
      throw new DomainException(result.error);
    }
    const { sessionId, user, rememberMe } = result.value;
    await this.cookies.issueSession(req, res, { sessionId, userId: user.id }, rememberMe);
    return { status: 'authenticated', user };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Authenticated()
  async logout(
    @CurrentSession() session: AuthenticatedSession,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this.logoutAction.execute(session.sessionId);
    await this.cookies.clear(req, res);
  }

  @Get('me')
  @Authenticated()
  @ZodResponse({ status: HttpStatus.OK, type: UserProfileDto })
  async me(@CurrentSession() session: AuthenticatedSession): Promise<UserProfileDto> {
    const result = await this.getCurrentUserAction.execute(session.userId);
    if (!result.ok) {
      throw new DomainException(result.error);
    }
    return result.value;
  }

  @Post('password/forgot')
  @HttpCode(HttpStatus.ACCEPTED)
  @AuthThrottle()
  @ApiErrors('generic.rate_limited')
  async forgotPassword(@Body() body: EmailRequestDto): Promise<void> {
    await this.requestPasswordResetAction.execute(body.email);
  }

  @Post('password/reset')
  @HttpCode(HttpStatus.NO_CONTENT)
  @AuthThrottle()
  @ApiErrors('auth.password_reset_token_invalid', 'generic.rate_limited')
  async resetPassword(@Body() body: ResetPasswordRequestDto): Promise<void> {
    const result = await this.resetPasswordAction.execute(body);
    if (!result.ok) {
      throw new DomainException(result.error);
    }
  }
}
