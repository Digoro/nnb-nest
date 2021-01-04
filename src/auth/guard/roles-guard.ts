import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { User } from "src/user/model/user.interface";
import { ROLES_KEY } from "../decorator/roles.decorator";
import { AuthService } from "../service/auth.service";


@Injectable()
export class RolesGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private authService: AuthService
    ) { }

    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        const roles = this.reflector.get<string[]>(ROLES_KEY, context.getHandler());
        if (!roles) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const user: User = request.user;
        return this.authService.findById(user.id).pipe(
            map((user: User) => {
                const hasRole = roles.find(role => role === user.role);
                return user && !!hasRole;
            })
        )
    }
}