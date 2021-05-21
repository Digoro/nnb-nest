import { Coupon, User } from "src/user/model/user.entity";
import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Product, ProductOption } from './../../product/model/product.entity';
import { NonMember } from './../../user/model/user.entity';
import { Payment } from "./payment.entity";

@Entity({ name: 'order' })
export class Order extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, entity => entity.orders)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ManyToOne(() => NonMember, entity => entity.orders)
    @JoinColumn({ name: 'non_member_id' })
    nonMember: NonMember;

    @ManyToOne(() => Product, entity => entity.orders)
    @JoinColumn({ name: 'product_id' })
    product: Product;

    @ManyToOne(() => Coupon, entity => entity.orders)
    @JoinColumn({ name: 'coupon_id' })
    coupon: Coupon;

    @Column({ nullable: true })
    point: number;

    @Column({ name: 'order_at' })
    orderAt: Date;

    @OneToMany(() => OrderItem, entity => entity.order)
    orderItems: OrderItem[];

    @OneToOne(() => Payment, payment => payment.order)
    payment: Payment;
}

@Entity({ name: 'order_item' })
export class OrderItem extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Order, entity => entity.orderItems)
    @JoinColumn({ name: 'order_id' })
    order: Order;

    @ManyToOne(() => ProductOption, entity => entity.orderItems)
    @JoinColumn({ name: 'product_option' })
    productOption: ProductOption;

    @Column()
    count: number;
}