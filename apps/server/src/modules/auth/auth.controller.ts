import { Controller, Post, Body, Get, Put } from '@nestjs/common';
import { IsString, IsOptional } from 'class-validator';
import { AuthService } from './auth.service';
import { Public } from './public.decorator';
import { CurrentUser } from './current-user.decorator';

class LoginDto {
  @IsString()
  code: string;
}

class UpdateProfileDto {
  @IsString()
  @IsOptional()
  nickname?: string;

  @IsString()
  @IsOptional()
  avatar?: string;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('login')
  async login(@Body() dto: LoginDto) {
    const result = await this.authService.login(dto.code);
    return {
      code: 0,
      message: 'success',
      data: result,
    };
  }

  @Get('profile')
  async getProfile(@CurrentUser() user: any) {
    return {
      code: 0,
      message: 'success',
      data: user,
    };
  }

  @Put('profile')
  async updateProfile(
    @CurrentUser() user: any,
    @Body() dto: UpdateProfileDto,
  ) {
    const result = await this.authService.updateProfile(user.id, dto);
    return {
      code: 0,
      message: 'success',
      data: result,
    };
  }
}
