import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { AuthService } from 'src/auth/service/auth.service';
import { User } from 'src/user/model/user.entity';
import { Role } from "src/user/model/user.interface";
import { EventCommentService } from './event-comment.service';


@Injectable()
export class UserIsEventCommentAuthorGuard implements CanActivate {
    constructor(
        private eventCommentService: EventCommentService,
        private userService: AuthService
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        try {
            const request = context.switchToHttp().getRequest();
            const reviewId = +request.params.id;
            const requestUser: User = request.user;
            const user = await this.userService.findById(requestUser.id);
            if (user.role === Role.ADMIN) return true;
            const review = await this.eventCommentService.findOne(reviewId);
            let hasPermission = false;
            if (user.id === review.user.id) {
                hasPermission = true
            }
            return !!user && hasPermission;
        } catch {
            return false;
        }
    }
}