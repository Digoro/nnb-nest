import { OmitType, PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsBoolean, IsDateString, IsEnum, IsInt, IsNumber, IsNumberString, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Event, Hashtag, Product, ProductRequest, ProductReview } from 'src/product/model/product.entity';
import { User } from 'src/user/model/user.entity';
import { Dto } from '../../shared/model/dto';
import { PaginationSearchDto } from './../../shared/model/dto';
import { ProductOption, ProductRepresentationPhoto } from './product.entity';
import { EventStatus, EventType, HashtagType, ProductStatus } from './product.interface';

export class ProductCreateDto implements Dto<Product>{
    @IsString()
    title: string;

    @IsNumber()
    price: number;

    @IsOptional()
    @IsNumber()
    discountPrice: number;

    @IsString()
    point: string;

    @IsString()
    recommend: string;

    @IsString()
    description: string;

    @IsNumber()
    lat: number;

    @IsNumber()
    lon: number;

    @IsString()
    address: string;

    @IsString()
    detailAddress: string;

    @IsOptional()
    @IsInt()
    runningMinutes: number;

    @IsOptional()
    @IsString()
    notice: string;

    @IsOptional()
    @IsString()
    checkList: string;

    @IsOptional()
    @IsString()
    includeList: string;

    @IsOptional()
    @IsString()
    excludeList: string;

    @IsInt()
    refundPolicy100: number;

    @IsInt()
    refundPolicy0: number;

    @IsOptional()
    @IsEnum(ProductStatus)
    status: ProductStatus;

    @IsInt()
    sortOrder: number;

    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => ProductRepresentationPhotoCreateDto)
    representationPhotos: ProductRepresentationPhoto[];

    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => ProductOptionCreateDto)
    options: ProductOption[];

    @ArrayMinSize(1)
    @IsInt({ each: true })
    categories: number[];

    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => HashtagCreateDto)
    hashtags: Hashtag[];

    toEntity(user: User): Product {
        const product = new Product();
        product.host = user;
        product.title = this.title;
        product.price = this.price;
        product.discountPrice = this.discountPrice;
        product.point = this.point;
        product.recommend = this.recommend;
        product.description = this.description;
        product.lat = this.lat;
        product.lon = this.lon;
        product.address = this.address;
        product.detailAddress = this.detailAddress;
        product.runningMinutes = this.runningMinutes;
        product.notice = this.notice;
        product.checkList = this.checkList;
        product.includeList = this.includeList;
        product.excludeList = this.excludeList;
        product.refundPolicy100 = this.refundPolicy100;
        product.refundPolicy0 = this.refundPolicy0;
        product.status = this.status;
        product.sortOrder = this.sortOrder;
        return product;
    }
}

export class ProductUpdateDto extends OmitType(ProductCreateDto, ['options']) {
    @ValidateNested({ each: true })
    @Type(() => ProductOptionCreateDto)
    addedOptions: ProductOptionCreateDto[];

    @ValidateNested({ each: true })
    @Type(() => ProductOptionCreateDto)
    removedOptions: ProductOptionCreateDto[];
}

export class ProductManageDto {
    @IsOptional()
    @IsEnum(ProductStatus)
    status: ProductStatus;

    @IsOptional()
    @IsNumber()
    sortOrder: number;
}

export class ProductSearchDto extends PaginationSearchDto {
    @IsEnum(ProductStatus)
    status: ProductStatus;

    @IsOptional()
    @IsNumberString()
    hostId: number;

    @IsOptional()
    @IsString()
    categoryId: number;

    @IsOptional()
    @IsString()
    hashtag: string;

    @IsOptional()
    @IsDateString()
    from: Date;

    @IsOptional()
    @IsDateString()
    to: Date;
}

export class ProductRepresentationPhotoCreateDto {
    @IsString()
    photo: string;

    @IsOptional()
    @IsInt()
    sortOrder: number;
}

export class ProductOptionCreateDto implements Dto<ProductOption> {
    @IsOptional()
    @IsNumber()
    id: number;

    @IsString()
    name: string;

    @IsDateString()
    date: Date;

    @IsOptional()
    @IsString()
    description: string;

    @IsInt()
    price: number;

    @IsInt()
    @Min(1)
    minParticipants: number;

    @IsInt()
    maxParticipants: number;

    @IsOptional()
    @IsBoolean()
    isOld: boolean;

    toEntity(product: Product): ProductOption {
        const option = new ProductOption();
        option.name = this.name;
        option.product = product;
        option.date = this.date;
        option.description = this.description;
        option.price = this.price;
        option.minParticipants = this.minParticipants;
        option.maxParticipants = this.maxParticipants;
        option.maxParticipants = this.maxParticipants;
        option.isOld = this.isOld;
        return option;
    }
}

export class CategoryCreateDto {
    @IsInt()
    productId: number;

    @IsString()
    name: string;
}

export class HashtagCreateDto {
    @IsOptional()
    @IsNumber()
    id: number;

    @IsOptional()
    @IsString()
    name: string;

    @IsEnum(HashtagType)
    type: HashtagType;

    @IsBoolean()
    isAnalysis: boolean;
}

export class ProductRequestCreateDto implements Dto<ProductRequest> {
    @IsInt()
    productId: number;

    @IsInt()
    numberOfPeople: number;

    @IsString()
    message: string;

    @IsBoolean()
    isChecked: boolean;

    @IsOptional()
    @IsDateString()
    checkedAt: Date;

    toEntity(user: User, product: Product): ProductRequest {
        const productRequest = new ProductRequest();
        productRequest.user = user;
        productRequest.product = product;
        productRequest.numberOfPeople = this.numberOfPeople;
        productRequest.message = this.message;
        productRequest.isChecked = this.isChecked;
        productRequest.checkedAt = this.checkedAt;
        return productRequest;
    }
}

export class EventCreateDto implements Dto<Event> {
    @IsString()
    title: string;

    @IsString()
    subtitle: string;

    @IsEnum(EventType)
    type: EventType;

    @IsEnum(EventStatus)
    status: EventStatus;

    @IsOptional()
    @IsString()
    photo: string;

    @IsString()
    contents: string;

    @IsBoolean()
    commentEnable: boolean;

    @IsDateString()
    startAt: Date;

    @IsDateString()
    endAt: Date;

    toEntity(): Event {
        const event = new Event();
        event.title = this.title;
        event.subtitle = this.subtitle;
        event.type = this.type;
        event.status = this.status;
        event.photo = this.photo;
        event.contents = this.contents;
        event.commentEnable = this.commentEnable;
        event.startAt = this.startAt;
        event.endAt = this.endAt;
        return event;
    }
}

export class EventUpdateDto extends PartialType(EventCreateDto) { }

export class EventSearchDto extends PaginationSearchDto {
    @IsOptional()
    @IsEnum(EventStatus)
    status: EventStatus;

    @IsOptional()
    @IsEnum(EventType)
    type: EventType;
}

export class ProductReviewCreateDto implements Dto<ProductReview> {
    @IsInt()
    productId: number;

    @IsInt()
    score: number;

    @IsString()
    comment: string;

    @IsOptional()
    @IsInt()
    parentId: number;

    @IsOptional()
    @IsString()
    photo: string;

    toEntity(user: User, product: Product, parent?: ProductReview): ProductReview {
        const review = new ProductReview();
        review.user = user;
        review.product = product;
        review.score = this.score;
        review.comment = this.comment;
        review.parent = parent;
        review.photo = this.photo;
        return review;
    }
}

export class ProductReviewUpdateDto extends PartialType(ProductReviewCreateDto) { }

export class ProductReviewSearchDto extends PaginationSearchDto {
    @IsOptional()
    @IsNumberString()
    product: number;

    @IsOptional()
    @IsNumberString()
    user: number;
}