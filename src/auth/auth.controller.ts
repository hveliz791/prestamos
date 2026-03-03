import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  // ✅ 5 intentos por minuto (correcto)
  @Throttle({ default: { ttl: 60, limit: 5 } })
  @Post('login')
  async login(
    @Body() body: { email: string; password: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const { token, user } = await this.auth.login(body.email, body.password);

    const isProd = process.env.NODE_ENV === 'production';

    res.cookie('access_token', token, {
      httpOnly: true,
      secure: isProd,  // prod: true (https)
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 1000, // 1 hora
    });
    return { user };
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    const isProd = process.env.NODE_ENV === 'production';

    res.clearCookie('access_token', {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
    });

    return { ok: true };
  }

  // ✅ útil para el router guard del frontend
  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  me(@Req() req: Request) {
    const u: any = (req as any).user;

    return {
      user: {
        id: u.sub,
        email: u.email,
        nombre: u.nombre,
        rol: u.rol,
      },
    };
  }
}