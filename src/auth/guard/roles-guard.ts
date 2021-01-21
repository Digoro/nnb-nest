import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { User } from 'src/user/model/user.entity';
import { ROLES_KEY } from '../decorator/roles.decorator';
import { AuthService } from "../service/auth.service";

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private authService: AuthService
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        try {
            const roles = this.reflector.get<string[]>(ROLES_KEY, context.getHandler());
            if (!roles) {
                return true;
            }
            const request = context.switchToHttp().getRequest();
            const requestUser: User = request.user;
            const user = await this.authService.findById(requestUser.id);
            const hasRole = roles.find(role => role === user.role);
            return user && !!hasRole;
        } catch {
            return false;
        }
    }
}