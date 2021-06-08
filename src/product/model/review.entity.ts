import { Min } from "class-validator";
import { Payment } from 'src/payment/model/payment.entity';
import { User } from "src/user/model/user.entity";
import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { BasicEntity } from '../../shared/model/basic.entity';

@Entity({ name: 'review' })
export class Review extends BasicEntity {
    @ManyToOne(() => User, entity => entity.reviews)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ManyToOne(() => Payment, entity => entity.reviews)
    @JoinColumn({ name: 'payment_id' })
    payment: Payment;

    @Column()
    @Min(0)
    score: number;

    @Column({ length: 1000 })
    comment: string;

    @ManyToOne(() => Review, entity => entity.children)
    parent: Review;

    @OneToMany(() => Review, entity => entity.parent)
    children: Review[];

    @OneToMany(() => ReviewPhoto, entity => entity.review)
    photos: ReviewPhoto[];
}

@Entity({ name: 'review_photo' })
export class ReviewPhoto extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Review, entity => entity.photos, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
    @JoinColumn({ name: 'review_id' })
    review: Review;

    @Column({ type: 'text' })
    photo: string;
}
