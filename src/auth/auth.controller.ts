import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common';
import { AuthService } from 'src/auth/service/auth.service';
import { UserLoginDto } from '../user/model/user.dto';

@Controller('auth')
export class AuthController {
    constructor(
        private authService: AuthService
    ) { }

    @Post('login')
    async login(@Body() user: UserLoginDto): Promise<Object> {
        try {
            const jwt = await this.authService.login(user);
            return { access_token: jwt };
        } catch {
            throw new UnauthorizedException();
        }
    }
}
