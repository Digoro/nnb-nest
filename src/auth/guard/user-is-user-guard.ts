import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { User } from "src/user/model/user.interface";
import { AuthService } from "../service/auth.service";


@Injectable()
export class UserIsUserGuard implements CanActivate {
    constructor(
        private authService: AuthService
    ) { }

    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        const request = context.switchToHttp().getRequest();
        const userId = +request.params.id;
        const user: User = request.user;
        return this.authService.findById(user.id).pipe(
            map((user: User) => {
                let hasPermission = false;
                if (user.id === userId) {
                    hasPermission = true
                }
                return !!user && hasPermission;
            })
        )
    }
}