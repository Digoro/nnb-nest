import { Order } from "src/payment/model/order.entity";
import { Column, Entity, OneToMany } from "typeorm";
import { BasicEntity } from '../../shared/model/basic.entity';
import { Product } from "./product.entity";

@Entity({ name: 'gift' })
export class Gift extends BasicEntity {
    @Column({ length: 30 })
    title: string;

    @Column({ type: 'text' })
    description: string;

    @Column({ length: 30 })
    name: string;

    @Column({ type: 'text' })
    photo: string;

    @OneToMany(() => Product, entity => entity.gift)
    products: Product[];

    @OneToMany(() => Order, entity => entity.gift)
    orders: Order[];
}