import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import type { SignOptions } from 'jsonwebtoken';
import { PrismaService } from '../prisma/prisma.service';
import { SignInDto } from './dto/signin.dto';
import { SignInResponse } from './types/signin-response.type';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async signIn(signInDto: SignInDto): Promise<SignInResponse> {
    const username = signInDto.username?.trim();
    const password = signInDto.password;

    if (!username || !password) {
      throw new UnauthorizedException('Invalid username or password');
    }

    const user = await this.prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid username or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid username or password');
    }

    const expiresIn = this.configService.get<string>(
      'JWT_EXPIRES_IN',
      '1d',
    ) as SignOptions['expiresIn'];
    const accessToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        username: user.username,
        slug: user.slug,
        fullname: user.fullname,
      },
      { expiresIn },
    );

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: String(expiresIn),
    };
  }
}
