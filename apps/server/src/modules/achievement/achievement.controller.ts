import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AchievementService } from './achievement.service';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('achievements')
@UseGuards(AuthGuard('jwt'))
export class AchievementController {
  constructor(private achievementService: AchievementService) {}

  /**
   * 获取用户成就列表（包含进度）
   */
  @Get('user')
  async getUserAchievements(@CurrentUser() user: any) {
    return this.achievementService.getUserAchievements(user.id);
  }

  /**
   * 获取用户统计数据
   */
  @Get('stats')
  async getUserStats(@CurrentUser() user: any) {
    return this.achievementService.getUserStats(user.id);
  }
}
