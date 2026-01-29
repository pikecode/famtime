import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

interface WxLoginResult {
  openid: string;
  session_key: string;
  unionid?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async login(code: string) {
    // 调用微信接口获取 openid
    const wxResult = await this.getWxSession(code);

    if (!wxResult.openid) {
      throw new UnauthorizedException('微信登录失败');
    }

    // 查找或创建用户
    let user = await this.prisma.user.findUnique({
      where: { openid: wxResult.openid },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          openid: wxResult.openid,
          unionid: wxResult.unionid,
          nickname: '新用户',
        },
      });
    }

    // 生成 JWT
    const token = this.jwtService.sign({
      sub: user.id,
      openid: user.openid,
    });

    return {
      token,
      user: {
        id: user.id,
        nickname: user.nickname,
        avatar: user.avatar,
      },
    };
  }

  private async getWxSession(code: string): Promise<WxLoginResult> {
    const appid = this.configService.get<string>('WECHAT_APPID');
    const secret = this.configService.get<string>('WECHAT_SECRET');

    // 开发环境模拟 - 使用固定的 openid 以保持用户身份稳定
    if (this.configService.get<string>('NODE_ENV') === 'development') {
      // 从 code 中提取用户标识，如果 code 以 'user_' 开头则使用，否则使用默认
      // 这样可以在开发时模拟不同用户：传入 'user_alice', 'user_bob' 等
      const openid = code.startsWith('user_') ? `dev_${code}` : 'dev_default_user';
      console.log('[Auth] Development mode - using openid:', openid);
      return {
        openid,
        session_key: 'dev_session_key',
      };
    }

    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appid}&secret=${secret}&js_code=${code}&grant_type=authorization_code`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.errcode) {
      throw new UnauthorizedException(`微信登录失败: ${data.errmsg}`);
    }

    return data;
  }

  async validateUser(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
    });
  }

  async updateProfile(
    userId: string,
    data: { nickname?: string; avatar?: string },
  ) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
    });
  }
}
