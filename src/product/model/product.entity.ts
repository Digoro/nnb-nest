import { UserEntity, UserProductLikeEntity } from "src/user/model/user.entity";
import { BaseEntity, Column, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { BasicEntity } from './../../shared/model/basic.entity';
import { HashtagType, ProductStatus } from './product.interface';

@Entity({ name: 'product' })
export class ProductEntity extends BasicEntity {
    @ManyToOne(() => UserEntity, userEntity => userEntity.products)
    @JoinColumn({ name: 'host_id' })
    host: UserEntity;

    @Column({ length: 254 })
    title: string;

    @Column({ length: 254 })
    point: string;

    @Column({ nullable: true, length: 254 })
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

    @Column({ nullable: true, name: 'running_minutes' })
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

    @OneToMany(() => ProductRepresentationPhotoEntity, entity => entity.product)
    representationPhotos: ProductRepresentationPhotoEntity[];

    @ManyToMany(() => CategoryEntity, { onUpdate: 'CASCADE', onDelete: 'CASCADE', })
    @JoinTable({
        name: 'product_category_map',
        joinColumn: { name: 'product_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'category_id', referencedColumnName: 'id' }
    })
    categories: CategoryEntity[];

    @OneToMany(() => ProductOptionEntity, entity => entity.product)
    options: ProductOptionEntity[];

    @ManyToMany(() => HashtagEntity)
    @JoinTable({
        name: 'product_hashtag_map',
        joinColumn: { name: 'product_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'hashtag_id', referencedColumnName: 'id' }
    })
    hashtags: HashtagEntity[];

    @ManyToMany(() => AnalysisHashtagEntity)
    @JoinTable({
        name: 'product_analysis_hashtag_map',
        joinColumn: { name: 'product_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'analysis_hashtag_id', referencedColumnName: 'id' }
    })
    analysisHashtags: HashtagEntity[];

    @OneToMany(() => UserProductLikeEntity, entity => entity.productId)
    userLikes: UserProductLikeEntity[];
}

@Entity({ name: 'product_representation_photo' })
export class ProductRepresentationPhotoEntity extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => ProductEntity, entity => entity.representationPhotos, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
    @JoinColumn({ name: 'product_id' },)
    product: ProductEntity;

    @Column({ length: 254 })
    photo: string;

    @Column()
    sortOrder: number;
}

@Entity({ name: 'category' })
export class CategoryEntity extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 254, unique: true })
    name: string;
}

@Entity({ name: 'product_option' })
export class ProductOptionEntity extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => ProductEntity, entity => entity.representationPhotos, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
    @JoinColumn({ name: 'product_id' },)
    product: ProductEntity;

    @Column({ length: 254 })
    name: string;

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
}

@Entity({ name: 'hashtag' })
export class HashtagEntity extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 254, unique: true })
    name: string;

    @Column({ type: 'enum', enum: HashtagType, default: HashtagType.PRODUCT })
    type: HashtagType;
}

@Entity({ name: 'analysis_hashtag' })
export class AnalysisHashtagEntity extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 254, unique: true })
    name: string;

    @Column({ type: 'enum', enum: HashtagType, default: HashtagType.PRODUCT })
    type: HashtagType;
}