import {
  Controller,
  Get,
  Put,
  Delete,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MemberService } from './member.service';

class UpdateMemberDto {
  nickname?: string;
  color?: string;
}

class TransferAdminDto {
  newAdminUserId: string;
}

@Controller()
@UseGuards(AuthGuard('jwt'))
export class MemberController {
  constructor(private memberService: MemberService) {}

  @Get('family/:familyId/members')
  async getFamilyMembers(@Param('familyId') familyId: string) {
    const members = await this.memberService.getFamilyMembers(familyId);
    return {
      code: 0,
      message: 'success',
      data: members,
    };
  }

  @Put('member/:id')
  async updateMember(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateMemberDto,
  ) {
    const member = await this.memberService.updateMember(req.user.id, id, dto);
    return {
      code: 0,
      message: 'success',
      data: member,
    };
  }

  @Delete('member/:id')
  async removeMember(@Request() req, @Param('id') id: string) {
    await this.memberService.removeMember(req.user.id, id);
    return {
      code: 0,
      message: 'success',
    };
  }

  @Post('family/:familyId/transfer-admin')
  async transferAdmin(
    @Request() req,
    @Param('familyId') familyId: string,
    @Body() dto: TransferAdminDto,
  ) {
    await this.memberService.transferAdmin(
      req.user.id,
      familyId,
      dto.newAdminUserId,
    );
    return {
      code: 0,
      message: 'success',
    };
  }
}
