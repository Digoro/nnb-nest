import { Column, Entity, OneToOne } from "typeorm";
import { BasicEntity } from "../../shared/model/basic.entity";
import { Payment } from "./payment.entity";

@Entity({ name: 'payment_cancel' })
export class PaymentCancel extends BasicEntity {
    @Column({ nullable: true, length: 500, comment: '취소 사유' })
    reason: string;

    @Column({ name: 'refund_price', comment: '환불 금액' })
    refundPrice: number;

    @Column({ name: 'cancel_at', comment: '취소 일시' })
    cancelAt: Date;

    @Column({ name: 'refund_coupon', default: false, comment: '쿠폰 환불 여부' })
    refundCoupon: boolean;

    @Column({ name: 'refund_point', default: false, comment: '포인트 환불 여부' })
    refundPoint: boolean;

    @OneToOne(() => Payment, payment => payment.paymentCancel)
    payment: Payment;
}