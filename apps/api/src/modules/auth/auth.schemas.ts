/**
 * Nest DTOs generated from the shared Zod contracts. The same schemas drive
 * request validation, response serialization, and the OpenAPI document.
 */
import {
  AuthenticatedResponseSchema,
  EmailRequestSchema,
  LoginRequestSchema,
  LoginResponseSchema,
  ResetPasswordRequestSchema,
  SignupRequestSchema,
  SignupResponseSchema,
  TwoFactorCodeRequestSchema,
  TwoFactorDisableRequestSchema,
  TwoFactorEnableResponseSchema,
  TwoFactorLoginRequestSchema,
  TwoFactorSetupResponseSchema,
  UserProfileSchema,
  VerifyEmailRequestSchema,
} from '@groundwork/shared';
import { createZodDto } from 'nestjs-zod';

export class SignupRequestDto extends createZodDto(SignupRequestSchema) {}
export class SignupResponseDto extends createZodDto(SignupResponseSchema) {}
export class LoginRequestDto extends createZodDto(LoginRequestSchema) {}
/** Union response: used as a schema carrier only, never as a parameter type. */
export const LoginResponseDto = createZodDto(LoginResponseSchema);
export class TwoFactorLoginRequestDto extends createZodDto(TwoFactorLoginRequestSchema) {}
export class AuthenticatedResponseDto extends createZodDto(AuthenticatedResponseSchema) {}
export class EmailRequestDto extends createZodDto(EmailRequestSchema) {}
export class VerifyEmailRequestDto extends createZodDto(VerifyEmailRequestSchema) {}
export class ResetPasswordRequestDto extends createZodDto(ResetPasswordRequestSchema) {}
export class UserProfileDto extends createZodDto(UserProfileSchema) {}
export class TwoFactorSetupResponseDto extends createZodDto(TwoFactorSetupResponseSchema) {}
export class TwoFactorCodeRequestDto extends createZodDto(TwoFactorCodeRequestSchema) {}
export class TwoFactorEnableResponseDto extends createZodDto(TwoFactorEnableResponseSchema) {}
export class TwoFactorDisableRequestDto extends createZodDto(TwoFactorDisableRequestSchema) {}
