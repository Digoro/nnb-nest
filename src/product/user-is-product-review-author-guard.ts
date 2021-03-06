import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { AuthService } from 'src/auth/service/auth.service';
import { User } from 'src/user/model/user.entity';
import { Role } from "src/user/model/user.interface";
import { ProductReviewService } from './product-review.service';


@Injectable()
export class UserIsProductReviewAuthorGuard implements CanActivate {
    constructor(
        private productReviewService: ProductReviewService,
        private userService: AuthService
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        try {
            const request = context.switchToHttp().getRequest();
            const reviewId = +request.params.id;
            const requestUser: User = request.user;
            const user = await this.userService.findById(requestUser.id);
            if (user.role === Role.ADMIN) return true;
            const review = await this.productReviewService.findOne(reviewId);
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