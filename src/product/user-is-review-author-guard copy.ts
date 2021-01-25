import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { AuthService } from 'src/auth/service/auth.service';
import { User } from 'src/user/model/user.entity';
import { ProductService } from './product.service';


@Injectable()
export class UserIsReviewAuthorGuard implements CanActivate {
    constructor(
        private productservice: ProductService,
        private userService: AuthService
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        try {
            const request = context.switchToHttp().getRequest();
            const reviewId = +request.params.id;
            const requestUser: User = request.user;
            const user = await this.userService.findById(requestUser.id);
            const review = await this.productservice.findProductReviewById(reviewId);
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