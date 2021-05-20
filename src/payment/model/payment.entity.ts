import { Review } from "src/product/model/review.entity";
import { Column, Entity, JoinColumn, OneToMany, OneToOne } from "typeorm";
import { BasicEntity } from "../../shared/model/basic.entity";
import { Order } from "./order.entity";
import { PaymentCancel } from "./payment-cancel.entity";
import { PayMethod, PG } from "./payment.interface";

@Entity({ name: 'payment' })
export class Payment extends BasicEntity {
    @OneToOne(() => PaymentCancel, entity => entity.payment)
    @JoinColumn({ name: 'payment_cancel' })
    paymentCancel: PaymentCancel;

    @OneToOne(() => Order, order => order.payment)
    @JoinColumn({ name: 'order_id' })
    order: Order;

    @Column({ nullable: true, name: 'pg_name', type: 'enum', enum: PG })
    pgName: PG;

    @Column({ nullable: true, name: 'pg_order_id', length: 500 })
    pgOrderId: string;

    @Column({ name: 'pay_at' })
    payAt: Date;

    @Column({ name: 'total_price', comment: '상품 구매옵션의 총 금액' })
    totalPrice: number;

    @Column({ name: 'pay_method', type: 'enum', enum: PayMethod })
    payMethod: PayMethod;

    @Column({ name: 'pay_price', comment: '결제 금액(totalPrice - discountPrice)' })
    payPrice: number;

    @Column({ name: 'pay_commission_price' })
    payCommissionPrice: number;

    @Column({ name: 'result' })
    result: boolean;

    @Column({ name: 'result_message', length: 500 })
    resultMessage: string;

    @Column({ nullable: true, name: 'card_name', length: 500 })
    cardName: string;

    @Column({ nullable: true, name: 'card_num', length: 500 })
    cardNum: string;

    @Column({ nullable: true, name: 'card_receipt', type: 'text' })
    cardReceipt: string;

    @Column({ nullable: true, name: 'bank_name', length: 500 })
    bankName: string;

    @Column({ nullable: true, name: 'bank_num', length: 500 })
    bankNum: string;

    @OneToMany(() => Review, entity => entity.payment)
    reviews: Review[];
}