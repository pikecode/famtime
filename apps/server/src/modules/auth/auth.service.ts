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

    // 开发环境模拟
    if (this.configService.get<string>('NODE_ENV') === 'development') {
      return {
        openid: `dev_${code}`,
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
}
