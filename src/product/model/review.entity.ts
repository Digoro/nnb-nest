import { Min } from "class-validator";
import { Payment } from 'src/payment/model/payment.entity';
import { User } from "src/user/model/user.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn } from "typeorm";
import { BasicEntity } from '../../shared/model/basic.entity';

@Entity({ name: 'review' })
export class Review extends BasicEntity {
    @ManyToOne(() => User, entity => entity.reviews)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @PrimaryColumn()
    paymentId: number;
    @ManyToOne(() => Payment, entity => entity.reviews)
    @JoinColumn({ name: 'paymentId' })
    payment: Payment;

    @Column()
    @Min(0)
    score: number;

    @Column({ type: 'text', nullable: true })
    photo: string;

    @Column({ length: 1000 })
    comment: string;

    @ManyToOne(() => Review, entity => entity.children)
    parent: Review;

    @OneToMany(() => Review, entity => entity.parent)
    children: Review[];
}
