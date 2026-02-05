import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationType } from '@prisma/client';

interface SubscriptionMessage {
  touser: string; // openid
  template_id: string;
  page?: string;
  data: Record<string, { value: string }>;
  miniprogram_state?: 'developer' | 'trial' | 'formal';
}

interface CreateNotificationDto {
  userId: string;
  type: NotificationType;
  title: string;
  content: string;
  data?: Record<string, any>;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private accessToken: string | null = null;
  private tokenExpireTime: number = 0;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  /**
   * 获取微信 access_token
   */
  private async getAccessToken(): Promise<string> {
    const now = Date.now();

    // 如果 token 还有效，直接返回
    if (this.accessToken && now < this.tokenExpireTime) {
      return this.accessToken;
    }

    const appid = this.configService.get<string>('WECHAT_APPID');
    const secret = this.configService.get<string>('WECHAT_SECRET');

    // 开发环境返回模拟 token
    if (this.configService.get<string>('NODE_ENV') === 'development') {
      this.accessToken = 'dev_access_token';
      this.tokenExpireTime = now + 7200 * 1000;
      return this.accessToken;
    }

    try {
      const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appid}&secret=${secret}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.errcode) {
        throw new Error(`获取 access_token 失败: ${data.errmsg}`);
      }

      this.accessToken = data.access_token;
      this.tokenExpireTime = now + (data.expires_in - 300) * 1000; // 提前5分钟过期

      return this.accessToken as string;
    } catch (error) {
      this.logger.error('Failed to get access token', error);
      throw error;
    }
  }

  /**
   * 发送订阅消息
   */
  async sendSubscriptionMessage(
    openid: string,
    templateId: string,
    data: Record<string, string>,
    page?: string,
  ): Promise<boolean> {
    try {
      const accessToken = await this.getAccessToken();

      // 开发环境模拟发送成功
      if (this.configService.get<string>('NODE_ENV') === 'development') {
        this.logger.log(
          `[DEV] Sending subscription message to ${openid}: ${JSON.stringify(data)}`,
        );
        return true;
      }

      const url = `https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=${accessToken}`;

      const message: SubscriptionMessage = {
        touser: openid,
        template_id: templateId,
        data: Object.entries(data).reduce(
          (acc, [key, value]) => {
            acc[key] = { value };
            return acc;
          },
          {} as Record<string, { value: string }>,
        ),
      };

      if (page) {
        message.page = page;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message),
      });

      const result = await response.json();

      if (result.errcode === 0) {
        this.logger.log(`Subscription message sent to ${openid}`);
        return true;
      } else {
        this.logger.error(
          `Failed to send subscription message: ${result.errmsg}`,
        );
        return false;
      }
    } catch (error) {
      this.logger.error('Error sending subscription message', error);
      return false;
    }
  }

  /**
   * 发送日程提醒
   */
  async sendEventReminder(
    userId: string,
    eventTitle: string,
    eventTime: string,
    eventId: string,
  ): Promise<boolean> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user || !user.openid) {
        this.logger.warn(`User ${userId} not found or no openid`);
        return false;
      }

      const templateId = this.configService.get<string>(
        'WECHAT_TEMPLATE_EVENT_REMINDER',
      );

      if (!templateId) {
        this.logger.warn('Event reminder template ID not configured');
        return false;
      }

      return this.sendSubscriptionMessage(
        user.openid,
        templateId,
        {
          thing1: eventTitle.slice(0, 20), // 日程主题，最多20个字符
          date2: eventTime, // 日程时间
          thing3: '请及时查看日程详情', // 日程描述
          thing4: '点击查看详情', // 温馨提示
        },
        `pages/event/detail/index?id=${eventId}`,
      );
    } catch (error) {
      this.logger.error('Error sending event reminder', error);
      return false;
    }
  }

  /**
   * 发送家庭邀请通知
   */
  async sendFamilyInvite(
    userId: string,
    familyName: string,
    inviterName: string,
    inviteCode: string,
  ): Promise<boolean> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user || !user.openid) {
        return false;
      }

      const templateId = this.configService.get<string>(
        'WECHAT_TEMPLATE_FAMILY_INVITE',
      );

      if (!templateId) {
        this.logger.warn('Family invite template ID not configured');
        return false;
      }

      const now = new Date();
      const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

      return this.sendSubscriptionMessage(
        user.openid,
        templateId,
        {
          thing1: inviterName.slice(0, 20), // 邀请人
          time2: timeStr, // 添加时间
          phone_number3: '10000000000', // 手机号（占位）
          thing4: `邀请码: ${inviteCode}，加入${familyName}`, // 温馨提示
        },
        `pages/family/join/index?code=${inviteCode}`,
      );
    } catch (error) {
      this.logger.error('Error sending family invite', error);
      return false;
    }
  }

  /**
   * 发送月度回忆通知
   */
  async sendMonthlyMemory(
    userId: string,
    period: string,
    eventCount: number,
    memoryId: string,
  ): Promise<boolean> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user || !user.openid) {
        return false;
      }

      const templateId = this.configService.get<string>(
        'WECHAT_TEMPLATE_MONTHLY_MEMORY',
      );

      if (!templateId) {
        this.logger.warn('Monthly memory template ID not configured');
        return false;
      }

      const now = new Date();
      const createTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

      return this.sendSubscriptionMessage(
        user.openid,
        templateId,
        {
          date1: createTime, // 创建时间
          thing2: `${period} 月度回忆录已生成`, // 报告简介
          time3: period, // 时间周期
          character_string4: `${eventCount}个精彩时刻`, // 事件数量
        },
        `pages/memory/detail/index?id=${memoryId}`,
      );
    } catch (error) {
      this.logger.error('Error sending monthly memory', error);
      return false;
    }
  }

  // ============ 通知记录管理 ============

  /**
   * 创建通知记录
   */
  async createNotification(dto: CreateNotificationDto) {
    return this.prisma.notification.create({
      data: {
        userId: dto.userId,
        type: dto.type,
        title: dto.title,
        content: dto.content,
        data: dto.data || {},
      },
    });
  }

  /**
   * 获取用户通知列表
   */
  async getUserNotifications(userId: string, limit = 50, offset = 0) {
    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.notification.count({ where: { userId } }),
    ]);

    return { notifications, total };
  }

  /**
   * 获取未读通知数量
   */
  async getUnreadCount(userId: string) {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  /**
   * 标记通知为已读
   */
  async markAsRead(userId: string, notificationId: string) {
    return this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
  }

  /**
   * 标记所有通知为已读
   */
  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  /**
   * 删除通知
   */
  async deleteNotification(userId: string, notificationId: string) {
    return this.prisma.notification.deleteMany({
      where: { id: notificationId, userId },
    });
  }
}
