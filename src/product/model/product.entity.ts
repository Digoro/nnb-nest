import { Order, OrderItem } from "src/payment/model/order.entity";
import { User, UserProductLike } from "src/user/model/user.entity";
import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";
import { BasicEntity } from './../../shared/model/basic.entity';
import { EventStatus, EventType, HashtagType, ProductStatus } from './product.interface';

@Entity({ name: 'product' })
export class Product extends BasicEntity {
    @Column({ length: 254 })
    title: string;

    @Column()
    cheapestPrice: number;

    @Column()
    cheapestDiscountPrice: number;

    @Column({ length: 254 })
    point: string;

    @Column({ length: 254 })
    recommend: string;

    @Column({ length: 254 })
    description: string;

    @Column()
    lat: number;

    @Column()
    lon: number;

    @Column({ length: 254 })
    address: string;

    @Column({ length: 254, name: 'detail_address' })
    detailAddress: string;

    @Column({ nullable: true, name: 'running_minutes', default: 0 })
    runningMinutes: number;

    @Column({ nullable: true, length: 254 })
    notice: string;

    @Column({ nullable: true, length: 254, name: 'check_list' })
    checkList: string;

    @Column({ nullable: true, length: 254, name: 'include_list' })
    includeList: string;

    @Column({ nullable: true, length: 254, name: 'exclude_list' })
    excludeList: string;

    @Column({ name: 'refund_policy_100' })
    refundPolicy100: number;

    @Column({ name: 'refund_policy_0' })
    refundPolicy0: number;

    @Column({ nullable: true, type: 'enum', enum: ProductStatus, default: ProductStatus.CREATED })
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
}


@Entity({ name: 'hashtag' })
export class Hashtag extends BasicEntity {
    @Column({ length: 254, unique: true })
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
    @ManyToOne(() => Product, product => product.productHashtagMap)
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

    @Column({ length: 254, unique: true })
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
    @ManyToOne(() => Product, product => product.productCategoryMap)
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
    @JoinColumn({ name: 'product_id' },)
    product: Product;

    @Column({ length: 254 })
    photo: string;

    @Column()
    sortOrder: number;
}

@Entity({ name: 'product_option' })
export class ProductOption extends BasicEntity {
    @ManyToOne(() => Product, entity => entity.representationPhotos, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
    @JoinColumn({ name: 'product_id' },)
    product: Product;

    @Column({ length: 254 })
    name: string;

    @Column()
    date: Date;

    @Column({ nullable: true, length: 254 })
    description: string;

    @Column()
    price: number;

    @Column({ name: 'discount_price' })
    discountPrice: number;

    @Column({ name: 'min_participants' })
    minParticipants: number;

    @Column({ name: 'max_participants' })
    maxParticipants: number;

    @OneToMany(() => OrderItem, entity => entity.productOption)
    orderItems: OrderItem[];
}

@Entity({ name: 'product_request' })
export class ProductRequest extends BasicEntity {
    @ManyToOne(() => Product, entity => entity.productRequests)
    @JoinColumn({ name: 'product_id' })
    product: Product;

    @ManyToOne(() => User, entity => entity.productRequests)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ name: 'number_of_people' })
    numberOfPeople: number;

    @Column({ length: 254 })
    message: string;

    @Column({ name: 'is_checked' })
    isChecked: boolean;

    @Column({ nullable: true, name: 'checked_at' })
    checkedAt: Date;
}

@Entity({ name: 'event' })
export class Event extends BasicEntity {
    @Column({ length: 254 })
    title: string;

    @Column({ length: 254 })
    subtitle: string;

    @Column({ type: 'enum', enum: EventType, default: EventType.PROMOTION })
    type: EventType;

    @Column({ type: 'enum', enum: EventStatus, default: EventStatus.CREATED })
    status: EventStatus;

    @Column({ nullable: true, length: 254 })
    photo: string;

    @Column({ length: 254 })
    contents: string;

    @Column({ name: 'comment_enable' })
    commentEnable: boolean;

    @Column({ name: 'start_at' })
    startAt: Date;

    @Column({ name: 'end_at' })
    endAt: Date;
}

@Entity({ name: 'product_review' })
export class ProductReview extends BasicEntity {
    @ManyToOne(() => User, entity => entity.productReviews)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ManyToOne(() => Product, entity => entity.productReviews)
    @JoinColumn({ name: 'product_id' })
    product: Product;

    @Column()
    score: number;

    @Column({ length: 254 })
    comment: string;

    @Column({ nullable: true, length: 254 })
    photo: string;

    @ManyToOne(() => ProductReview, entity => entity.children)
    parent: ProductReview;

    @OneToMany(() => ProductReview, entity => entity.parent)
    children: ProductReview[];
}