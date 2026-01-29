import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { IsString, IsOptional } from 'class-validator';
import { AuthGuard } from '@nestjs/passport';
import { FamilyService } from './family.service';

class CreateFamilyDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  avatar?: string;
}

class JoinFamilyDto {
  @IsString()
  inviteCode: string;

  @IsString()
  nickname: string;
}

@Controller('family')
@UseGuards(AuthGuard('jwt'))
export class FamilyController {
  constructor(private familyService: FamilyService) {}

  @Post()
  async create(@Request() req: any, @Body() dto: CreateFamilyDto) {
    const family = await this.familyService.create(
      req.user.id,
      dto.name,
      dto.avatar,
    );
    return {
      code: 0,
      message: 'success',
      data: family,
    };
  }

  @Get('my')
  async getMyFamily(@Request() req: any) {
    console.log('[FamilyController] GET /family/my called by user:', req.user?.id);
    const family = await this.familyService.getUserFamily(req.user.id);
    console.log('[FamilyController] Returning families:', JSON.stringify(family, null, 2));
    return {
      code: 0,
      message: 'success',
      data: family,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const family = await this.familyService.findById(id);
    return {
      code: 0,
      message: 'success',
      data: family,
    };
  }

  @Post('join')
  async join(@Request() req: any, @Body() dto: JoinFamilyDto) {
    const member = await this.familyService.joinByInviteCode(
      req.user.id,
      dto.inviteCode,
      dto.nickname,
    );
    return {
      code: 0,
      message: 'success',
      data: member,
    };
  }

  @Delete(':id/leave')
  async leave(@Request() req: any, @Param('id') id: string) {
    await this.familyService.leave(req.user.id, id);
    return {
      code: 0,
      message: 'success',
    };
  }

  @Post(':id/invite-code')
  async refreshInviteCode(@Request() req: any, @Param('id') id: string) {
    const result = await this.familyService.refreshInviteCode(req.user.id, id);
    return {
      code: 0,
      message: 'success',
      data: result,
    };
  }
}
