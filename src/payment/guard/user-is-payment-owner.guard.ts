import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { AuthService } from 'src/auth/service/auth.service';
import { User } from 'src/user/model/user.entity';
import { Role } from "src/user/model/user.interface";
import { PaymentService } from './../payment.service';


@Injectable()
export class UserIsPaymentOwnerGuard implements CanActivate {
    constructor(
        private paymentService: PaymentService,
        private userService: AuthService
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        try {
            const request = context.switchToHttp().getRequest();
            const paymentId = +request.params.id;
            const requestUser: User = request.user;

            const payment = await this.paymentService.findOneByOwner(paymentId);
            const paymentUser = payment.order.user

            const user = await this.userService.findById(requestUser.id);
            if (user.role === Role.ADMIN) return true;
            let hasPermission = false;
            if (user.id === paymentUser.id) {
                hasPermission = true
            }
            return !!user && hasPermission;
        } catch {
            return false;
        }
    }
}