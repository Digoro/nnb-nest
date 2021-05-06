import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { AuthService } from 'src/auth/service/auth.service';
import { User } from 'src/user/model/user.entity';
import { Role } from "src/user/model/user.interface";
import { Repository } from "typeorm";
import { Payment } from "../model/payment.entity";

@Injectable()
export class UserIsPaymentOwnerGuard implements CanActivate {
    constructor(
        private userService: AuthService,
        @InjectRepository(Payment) private paymentRepository: Repository<Payment>,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        try {
            const request = context.switchToHttp().getRequest();
            const method = request.method;
            let paymentId: number;
            if (method === 'POST' || method === 'PUT') {
                paymentId = +request.body.paymentId;
            } else {
                paymentId = +request.params.id;
            }
            const requestUser: User = request.user;

            const payment = await this.paymentRepository.findOne(paymentId, {
                relations: ['order', 'order.product', 'order.product.representationPhotos',
                    'order.coupon', 'order.orderItems', 'order.orderItems.productOption', 'order.user']
            });
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