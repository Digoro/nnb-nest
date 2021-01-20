import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { AuthService } from "../service/auth.service";


@Injectable()
export class UserIsUserGuard implements CanActivate {
    constructor(
        private authService: AuthService
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const requestUserId = +request.params.id;
        const requestCurrentUser = request.user;
        const currentUser = await this.authService.findById(requestCurrentUser.id);
        if (!currentUser) return false;
        return currentUser.id === requestUserId;
    }
}