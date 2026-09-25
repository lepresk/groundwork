/**
 * Two-factor management for the signed-in user: setup, enable, disable.
 */
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';
import { ApiErrors } from '../../shared/errors/api-errors.decorator.js';
import { DomainException } from '../../shared/errors/domain-exception.js';
import { AuthThrottle } from '../../shared/throttling/auth-throttle.decorator.js';
import { DisableTwoFactorAction } from './actions/disable-two-factor.action.js';
import { EnableTwoFactorAction } from './actions/enable-two-factor.action.js';
import { StartTwoFactorSetupAction } from './actions/start-two-factor-setup.action.js';
import {
  TwoFactorCodeRequestDto,
  TwoFactorDisableRequestDto,
  TwoFactorEnableResponseDto,
  TwoFactorSetupResponseDto,
} from './auth.schemas.js';
import { Authenticated } from './session/authenticated.decorator.js';
import { CurrentSession } from './session/current-session.decorator.js';
import type { AuthenticatedSession } from './session/session.types.js';

@ApiTags('Two-factor')
@Authenticated()
@Controller('auth/two-factor')
export class TwoFactorController {
  constructor(
    private readonly startSetupAction: StartTwoFactorSetupAction,
    private readonly enableAction: EnableTwoFactorAction,
    private readonly disableAction: DisableTwoFactorAction,
  ) {}

  @Post('setup')
  @HttpCode(HttpStatus.OK)
  @ZodResponse({ status: HttpStatus.OK, type: TwoFactorSetupResponseDto })
  @ApiErrors('auth.two_factor_already_enabled')
  async setup(@CurrentSession() session: AuthenticatedSession): Promise<TwoFactorSetupResponseDto> {
    const result = await this.startSetupAction.execute(session.userId);
    if (!result.ok) {
      throw new DomainException(result.error);
    }
    return result.value;
  }

  @Post('enable')
  @HttpCode(HttpStatus.OK)
  @AuthThrottle()
  @ZodResponse({ status: HttpStatus.OK, type: TwoFactorEnableResponseDto })
  @ApiErrors(
    'auth.two_factor_setup_missing',
    'auth.two_factor_already_enabled',
    'auth.two_factor_code_invalid',
  )
  async enable(
    @CurrentSession() session: AuthenticatedSession,
    @Body() body: TwoFactorCodeRequestDto,
  ): Promise<TwoFactorEnableResponseDto> {
    const result = await this.enableAction.execute(session.userId, body.code);
    if (!result.ok) {
      throw new DomainException(result.error);
    }
    return result.value;
  }

  @Post('disable')
  @HttpCode(HttpStatus.NO_CONTENT)
  @AuthThrottle()
  @ApiErrors(
    'auth.two_factor_not_enabled',
    'auth.invalid_credentials',
    'auth.two_factor_code_invalid',
  )
  async disable(
    @CurrentSession() session: AuthenticatedSession,
    @Body() body: TwoFactorDisableRequestDto,
  ): Promise<void> {
    const result = await this.disableAction.execute(session.userId, body);
    if (!result.ok) {
      throw new DomainException(result.error);
    }
  }
}
