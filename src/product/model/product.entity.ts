import { Max, Min } from "class-validator";
import { Order, OrderItem } from "src/payment/model/order.entity";
import { User, UserProductLike } from "src/user/model/user.entity";
import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";
import { BasicEntity } from './../../shared/model/basic.entity';
import { BlogType, EventStatus, EventType, HashtagType, ProductStatus } from './product.interface';

@Entity({ name: 'product' })
export class Product extends BasicEntity {
    @Column({ length: 30 })
    title: string;

    @Column()
    @Min(0)
    @Max(100000000)
    price: number;

    @Column({ name: 'discount_price', nullable: true })
    @Min(0)
    @Max(100000000)
    discountPrice: number;

    @Column({ length: 500 })
    point: string;

    @Column({ length: 500 })
    recommend: string;

    @Column({ select: false, type: 'text' })
    description: string;

    @Column({ type: 'float' })
    lat: number;

    @Column({ type: 'float' })
    lon: number;

    @Column({ type: 'text' })
    address: string;

    @Column({ length: 500, name: 'detail_address' })
    detailAddress: string;

    @Column({ nullable: true, length: 1000, name: 'how_to_come' })
    howToCome: string;

    @Column({ nullable: true, name: 'running_days', default: 0 })
    @Min(0)
    @Max(30)
    runningDays: number;

    @Column({ nullable: true, name: 'running_hours', default: 0 })
    @Min(0)
    @Max(23)
    runningHours: number;

    @Column({ nullable: true, name: 'running_minutes', default: 0 })
    @Min(0)
    @Max(50)
    runningMinutes: number;

    @Column({ nullable: true, length: 500 })
    notice: string;

    @Column({ nullable: true, length: 500, name: 'check_list' })
    checkList: string;

    @Column({ nullable: true, length: 500, name: 'include_list' })
    includeList: string;

    @Column({ nullable: true, length: 500, name: 'exclude_list' })
    excludeList: string;

    @Column({ name: 'refund_policy_100' })
    @Min(0)
    @Max(9999)
    refundPolicy100: number;

    @Column({ name: 'refund_policy_0' })
    @Min(0)
    @Max(9999)
    refundPolicy0: number;

    @Column({ nullable: true, type: 'enum', enum: ProductStatus, default: ProductStatus.DISABLED })
    status: ProductStatus;

    @Column({ nullable: true, name: 'sort_order' })
    sortOrder: number;

    @ManyToOne(() => User, userEntity => userEntity.products)
    @JoinColumn({ name: 'host_id' })
    host: User;

    @OneToMany(() => ProductRepresentationPhoto, entity => entity.product)
    representationPhotos: ProductRepresentationPhoto[];

    @OneToMany(() => ProductOption, entity => entity.product)
    options: ProductOption[];

    @OneToMany(() => UserProductLike, entity => entity.product)
    userLikes: UserProductLike[];

    @OneToMany(() => ProductRequest, entity => entity.product)
    productRequests: ProductRequest[];

    @OneToMany(() => ProductReview, entity => entity.product)
    productReviews: ProductReview[];

    @OneToMany(() => ProductCategoryMap, map => map.product)
    productCategoryMap: ProductCategoryMap[];

    categories: Category[];

    @OneToMany(() => ProductHashtagMap, map => map.product)
    productHashtagMap: ProductHashtagMap[];

    hashtags: Hashtag[];

    @OneToMany(() => Order, entity => entity.product)
    orders: Order[];

    likes: number;

    isSetLike: boolean;

    @OneToMany(() => EventProductMap, map => map.product)
    eventProductMap: EventProductMap[];
}

@Entity({ name: 'hashtag' })
export class Hashtag extends BasicEntity {
    @Column({ length: 20, unique: true })
    name: string;

    @Column({ type: 'enum', enum: HashtagType, default: HashtagType.PRODUCT })
    type: HashtagType;

    @Column({ name: 'is_analysis', default: false })
    isAnalysis: boolean;

    @OneToMany(() => ProductHashtagMap, map => map.hashtag)
    productHashtagMap: ProductHashtagMap[];
}

@Entity({ name: 'product_hashtag_map' })
export class ProductHashtagMap extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @PrimaryColumn()
    productId: number;
    @ManyToOne(() => Product, product => product.productHashtagMap, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
    @JoinColumn({ name: 'productId' })
    product: Product;

    @PrimaryColumn()
    hashtagId: number;
    @ManyToOne(() => Hashtag, hashtag => hashtag.productHashtagMap)
    @JoinColumn({ name: 'hashtagId' })
    hashtag: Hashtag;
}

@Entity({ name: 'category' })
export class Category extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 20, unique: true })
    name: string;

    @OneToMany(() => ProductCategoryMap, map => map.category)
    productCategoryMap: ProductCategoryMap[];
}

@Entity({ name: 'product_category_map' })
export class ProductCategoryMap extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @PrimaryColumn()
    productId: number;
    @ManyToOne(() => Product, product => product.productCategoryMap, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
    @JoinColumn({ name: 'productId' })
    product: Product;

    @PrimaryColumn()
    categoryId: number;
    @ManyToOne(() => Category, category => category.productCategoryMap)
    @JoinColumn({ name: 'categoryId' })
    category: Category;
}

@Entity({ name: 'product_representation_photo' })
export class ProductRepresentationPhoto extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Product, entity => entity.representationPhotos, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
    @JoinColumn({ name: 'product_id' })
    product: Product;

    @Column({ type: 'text' })
    photo: string;

    @Column()
    sortOrder: number;
}

@Entity({ name: 'product_option' })
export class ProductOption extends BasicEntity {
    @ManyToOne(() => Product, entity => entity.representationPhotos, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
    @JoinColumn({ name: 'product_id' },)
    product: Product;

    @Column({ length: 100 })
    name: string;

    @Column()
    date: Date;

    @Column({ nullable: true, length: 300 })
    description: string;

    @Column()
    @Min(0)
    @Max(100000000)
    price: number;

    @Column({ name: 'min_participants' })
    @Min(1)
    minParticipants: number;

    @Column({ name: 'max_participants' })
    @Min(1)
    maxParticipants: number;

    @Column({ name: 'is_old', default: false })
    isOld: boolean;

    @OneToMany(() => OrderItem, entity => entity.productOption)
    orderItems: OrderItem[];
}

@Entity({ name: 'product_request' })
export class ProductRequest extends BasicEntity {
    @PrimaryColumn()
    productId: number;
    @ManyToOne(() => Product, entity => entity.productRequests, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
    @JoinColumn({ name: 'productId' })
    product: Product;

    @PrimaryColumn()
    userId: number;
    @ManyToOne(() => User, entity => entity.productRequests)
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column({ name: 'number_of_people' })
    @Min(1)
    @Max(999)
    numberOfPeople: number;

    @Column({ length: 500 })
    message: string;

    @Column({ name: 'is_checked' })
    isChecked: boolean;

    @Column({ nullable: true, name: 'checked_at' })
    checkedAt: Date;
}

@Entity({ name: 'event' })
export class Event extends BasicEntity {
    @Column({ length: 30 })
    title: string;

    @Column({ length: 100 })
    subtitle: string;

    @Column({ type: 'enum', enum: EventType, default: EventType.PROMOTION })
    type: EventType;

    @Column({ type: 'enum', enum: EventStatus, default: EventStatus.CREATED })
    status: EventStatus;

    @Column({ nullable: true, type: 'text' })
    photo: string;

    @Column({ type: 'text' })
    contents: string;

    @Column({ name: 'comment_enable' })
    commentEnable: boolean;

    @Column({ name: 'start_at' })
    startAt: Date;

    @Column({ name: 'end_at' })
    endAt: Date;

    @Column({ nullable: true, length: 45 })
    recommendTitle: string;

    @OneToMany(() => EventComment, entity => entity.event)
    eventComments: EventComment[];

    @OneToMany(() => EventProductMap, map => map.event)
    eventProductMap: EventProductMap[];

    products?: Product[]
}

@Entity({ name: 'event_product_map' })
export class EventProductMap extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @PrimaryColumn()
    eventId: number;
    @ManyToOne(() => Event, event => event.eventProductMap, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
    @JoinColumn({ name: 'eventId' })
    event: Event;

    @PrimaryColumn()
    productId: number;
    @ManyToOne(() => Product, product => product.eventProductMap, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
    @JoinColumn({ name: 'productId' })
    product: Product;
}

@Entity({ name: 'event_comment' })
export class EventComment extends BasicEntity {
    @ManyToOne(() => User, entity => entity.eventComments)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ManyToOne(() => Event, entity => entity.eventComments, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
    @JoinColumn({ name: 'event_id' })
    event: Event;

    @Column()
    @Min(0)
    score: number;

    @Column({ length: 1000 })
    comment: string;

    @Column({ nullable: true, type: 'text' })
    photo: string;

    @ManyToOne(() => EventComment, entity => entity.children)
    parent: EventComment;

    @OneToMany(() => EventComment, entity => entity.parent)
    children: EventComment[];
}

@Entity({ name: 'product_review' })
export class ProductReview extends BasicEntity {
    @ManyToOne(() => User, entity => entity.productReviews)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ManyToOne(() => Product, entity => entity.productReviews, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
    @JoinColumn({ name: 'product_id' })
    product: Product;

    @Column()
    @Min(0)
    score: number;

    @Column({ length: 1000 })
    comment: string;

    @Column({ nullable: true, type: 'text' })
    photo: string;

    @ManyToOne(() => ProductReview, entity => entity.children)
    parent: ProductReview;

    @OneToMany(() => ProductReview, entity => entity.parent)
    children: ProductReview[];
}

@Entity({ name: 'blog' })
export class Blog extends BasicEntity {
    @Column({ length: 30 })
    title: string;

    @Column({ type: 'enum', enum: BlogType, default: BlogType.INFO })
    type: BlogType;

    @Column({ nullable: true, type: 'text' })
    photo: string;

    @Column({ type: 'text' })
    contents: string;
}