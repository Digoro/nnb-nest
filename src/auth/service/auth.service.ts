import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { from, Observable } from 'rxjs';
import { User } from '../../user/model/user.interface';
const bcrypt = require('bcrypt');

@Injectable()
export class AuthService {
    constructor(private jwtService: JwtService) { }

    generateJWT(user: User): Observable<string> {
        return from(this.jwtService.signAsync({ user }));
    }

    hashPassword(password: string): string {
        return bcrypt.hashSync(password, 12)
    }

    comparePassword(newPassword: string, passwordHash: string): Observable<any | boolean> {
        return from<any | boolean>(bcrypt.compare(newPassword, passwordHash));
    }
}
