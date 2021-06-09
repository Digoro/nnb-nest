import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { AuthService } from 'src/auth/service/auth.service';
import { Payment } from "src/payment/model/payment.entity";
import { Repository } from "typeorm";
import { User } from '../user/model/user.entity';
import { Role } from '../user/model/user.interface';

@Injectable()
export class HostIsProductHostGuard implements CanActivate {
    constructor(
        private userService: AuthService,
        @InjectRepository(Payment) private paymentRepository: Repository<Payment>,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        try {
            const request = context.switchToHttp().getRequest();
            const paymentId = +request.body.paymentId;
            const payment = await this.paymentRepository.findOne(paymentId, {
                relations: ['order', 'order.product', 'order.product.host']
            });
            const product = payment.order.product;
            const requestUser: User = request.user;
            const user = await this.userService.findById(requestUser.id);
            if (user.role === Role.ADMIN) return true;
            let hasPermission = false;
            if (user.id === product.host.id) {
                hasPermission = true
            }
            return !!user && hasPermission;
        } catch {
            return false;
        }
    }
}