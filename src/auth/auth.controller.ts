import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { GetUser } from './decorators/get-user.decorator';
import { SignInDto } from './dto/signin.dto';
import { AuthGuard } from './guards/auth.guard';
import { SignInResponse } from './types/signin-response.type';

@Controller('api/v1')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signin')
  @HttpCode(HttpStatus.OK)
  signIn(@Body() signInDto: SignInDto): Promise<SignInResponse> {
    return this.authService.signIn(signInDto);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  getMe(@GetUser('fullname') fullname: string) {
    return { fullname };
  }
}
