import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

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
      secure: isProd,      // en prod: true (HTTPS)
      sameSite: 'lax',     // buena opción para apps normales
      path: '/',
      maxAge: 60 * 60 * 1000, // 1 hora
    });

    // 👇 ya no mandamos token al frontend
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

  // útil para comprobar sesión desde el frontend
  @Get('me')
  me(@Req() req: Request) {
    // aquí todavía no validamos JWT; en el siguiente paso lo protegemos con guard cookie/jwt
    return { ok: true };
  }
}