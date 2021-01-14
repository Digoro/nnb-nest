import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { AuthService } from 'src/auth/service/auth.service';
import { User } from "src/user/model/user.interface";
import { ProductService } from './product.service';


@Injectable()
export class UserIsHostGuard implements CanActivate {
    constructor(
        private productservice: ProductService,
        private userService: AuthService
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const productId = +request.params.id;
        const requestUser: User = request.user;

        const user = await this.userService.findById(requestUser.id);
        const product = await this.productservice.findById(productId);

        let hasPermission = false;
        if (user.id === product.host.id) {
            hasPermission = true
        }
        return !!user && hasPermission;
    }
}