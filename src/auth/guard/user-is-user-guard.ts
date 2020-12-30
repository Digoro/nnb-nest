import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { User } from "src/user/model/user.interface";
import { UserSecurityService } from "../service/user-security.service";


@Injectable()
export class UserIsUserGuard implements CanActivate {
    constructor(
        private userSecurityService: UserSecurityService
    ) { }

    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        const request = context.switchToHttp().getRequest();
        const params = request.params;
        const user: User = request.user.user;
        return this.userSecurityService.findById(user.id).pipe(
            map((user: User) => {
                let hasPermission = false;
                if (user.id === +params.id) {
                    hasPermission = true
                }
                return !!user && hasPermission;
            })
        )
    }
}