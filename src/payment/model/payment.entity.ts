import { Column, Entity } from "typeorm";
import { BasicEntity } from "../../shared/model/basic.entity";
import { PayMethod, PG } from "./payment.interface";

@Entity({ name: 'payment' })
export class Payment extends BasicEntity {
    @Column({ name: 'order_id', length: 254 })
    orderId: string;

    @Column({ nullable: true, name: 'pg_name', type: 'enum', enum: PG })
    pgName: PG;

    @Column({ nullable: true, name: 'pg_order_id', length: 254 })
    pgOrderId: string;

    @Column({ name: 'pay_at' })
    payAt: Date;

    @Column({ name: 'total_price' })
    totalPrice: number;

    @Column({ name: 'pay_method', type: 'enum', enum: PayMethod })
    payMethod: PayMethod;

    @Column({ name: 'pay_price' })
    payPrice: number;

    @Column({ name: 'pay_commission_price' })
    payCommissionPrice: number;

    @Column({ name: 'result' })
    result: boolean;

    @Column({ name: 'result_message', length: 254 })
    resultMessage: string;

    @Column({ nullable: true, name: 'card_name', length: 254 })
    cardName: string;

    @Column({ nullable: true, name: 'card_num', length: 254 })
    cardNum: string;

    @Column({ nullable: true, name: 'card_receipt', length: 254 })
    cardReceipt: string;

    @Column({ nullable: true, name: 'band_name', length: 254 })
    bandName: string;

    @Column({ nullable: true, name: 'bank_num', length: 254 })
    bankNum: string;
}