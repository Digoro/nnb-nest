import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Observable } from "rxjs";
import { map, switchMap } from "rxjs/operators";
import { UserSecurityService } from 'src/auth/service/user-security.service';
import { User } from "src/user/model/user.interface";
import { Product } from './../model/product.interface';
import { ProductService } from './../service/product.service';


@Injectable()
export class UserIsHostGuard implements CanActivate {
    constructor(
        private productservice: ProductService,
        private userService: UserSecurityService
    ) { }

    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        const request = context.switchToHttp().getRequest();
        const productId = +request.params.id;
        const user: User = request.user;
        return this.userService.findById(user.id).pipe(
            switchMap((user: User) => {
                return this.productservice.findById(productId).pipe(
                    map((product: Product) => {
                        let hasPermission = false;
                        if (user.id === product.host.id) {
                            hasPermission = true
                        }
                        return !!user && hasPermission;
                    })
                )
            })
        )
    }
}