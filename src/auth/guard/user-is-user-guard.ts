import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Role } from "src/user/model/user.interface";
import { AuthService } from "../service/auth.service";


@Injectable()
export class UserIsUserGuard implements CanActivate {
    constructor(
        private authService: AuthService
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        try {
            const request = context.switchToHttp().getRequest();
            const requestUserId = +request.params.id;
            const requestCurrentUser = request.user;
            const currentUser = await this.authService.findById(requestCurrentUser.id);
            if (!currentUser) return false;
            if (currentUser.role === Role.ADMIN) return true;
            return currentUser.id === requestUserId;
        } catch {
            return false;
        }
    }
}