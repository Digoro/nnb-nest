import { OmitType, PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsBoolean, IsDateString, IsEnum, IsInt, IsNumber, IsNumberString, IsOptional, IsString, Max, MaxLength, Min, ValidateNested } from 'class-validator';
import { Blog, Event, EventReview, Hashtag, Product, ProductRequest, ProductReview } from 'src/product/model/product.entity';
import { User } from 'src/user/model/user.entity';
import { Dto } from '../../shared/model/dto';
import { PaginationSearchDto } from './../../shared/model/dto';
import { ProductOption, ProductRepresentationPhoto } from './product.entity';
import { BlogType, EventStatus, EventType, HashtagType, ProductStatus } from './product.interface';

export class ProductCreateDto implements Dto<Product>{
    @IsString()
    @MaxLength(30)
    title: string;

    @IsNumber()
    @Min(0)
    @Max(100000000)
    price: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(100000000)
    discountPrice: number;

    @IsString()
    @MaxLength(500)
    point: string;

    @IsString()
    @MaxLength(500)
    recommend: string;

    @IsString()
    @MaxLength(65535)
    description: string;

    @IsNumber()
    lat: number;

    @IsNumber()
    lon: number;

    @IsString()
    @MaxLength(65535)
    address: string;

    @IsString()
    @MaxLength(500)
    detailAddress: string;

    @IsOptional()
    @IsInt()
    @Min(0)
    @Max(30)
    runningDays: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    @Max(23)
    runningHours: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    @Max(50)
    runningMinutes: number;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    notice: string;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    checkList: string;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    includeList: string;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    excludeList: string;

    @IsInt()
    @Min(0)
    @Max(9999)
    refundPolicy100: number;

    @IsInt()
    @Min(0)
    @Max(9999)
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
        product.runningDays = this.runningDays;
        product.runningHours = this.runningHours;
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
    @IsNumber()
    @Type(() => Number)
    hostId: number;

    @IsOptional()
    @IsString()
    categoryId: number;

    @IsOptional()
    @IsString()
    @MaxLength(20)
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
    @MaxLength(65535)
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
    @MaxLength(100)
    name: string;

    @IsDateString()
    date: Date;

    @IsOptional()
    @IsString()
    @MaxLength(300)
    description: string;

    @IsInt()
    @Min(0)
    @Max(100000000)
    price: number;

    @IsInt()
    @Min(1)
    minParticipants: number;

    @IsInt()
    @Min(1)
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
    @MaxLength(20)
    name: string;
}

export class HashtagCreateDto {
    @IsOptional()
    @IsNumber()
    id: number;

    @IsOptional()
    @IsString()
    @MaxLength(20)
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
    @Min(1)
    @Max(999)
    numberOfPeople: number;

    @IsString()
    @MaxLength(500)
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
    @MaxLength(30)
    title: string;

    @IsString()
    @MaxLength(100)
    subtitle: string;

    @IsEnum(EventType)
    type: EventType;

    @IsEnum(EventStatus)
    status: EventStatus;

    @IsString()
    @MaxLength(65535)
    photo: string;

    @IsString()
    @MaxLength(65535)
    contents: string;

    @IsBoolean()
    commentEnable: boolean;

    @IsDateString()
    startAt: Date;

    @IsDateString()
    endAt: Date;

    @IsOptional()
    @IsString()
    @MaxLength(45)
    recommendTitle: string;

    @IsOptional()
    @IsInt({ each: true })
    products: number[];

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
        event.recommendTitle = this.recommendTitle;
        event.endAt = this.endAt;
        return event;
    }
}

export class EventUpdateDto extends PartialType(EventCreateDto) { }

export class EventSearchDto extends PaginationSearchDto {
    @IsEnum(EventStatus)
    status: EventStatus;

    @IsEnum(EventType)
    type: EventType;
}

export class EventReviewCreateDto implements Dto<EventReview> {
    @IsInt()
    eventId: number;

    @IsInt()
    @Min(0)
    score: number;

    @IsString()
    @MaxLength(1000)
    comment: string;

    @IsOptional()
    @IsInt()
    parentId: number;

    @IsOptional()
    @IsString()
    @MaxLength(65535)
    photo: string;

    toEntity(user: User, event: Event, parent?: EventReview): EventReview {
        const review = new EventReview();
        review.user = user;
        review.event = event;
        review.score = this.score;
        review.comment = this.comment;
        review.parent = parent;
        review.photo = this.photo;
        return review;
    }
}

export class EventReviewUpdateDto extends PartialType(EventReviewCreateDto) { }

export class EventReviewSearchDto extends PaginationSearchDto {
    @IsOptional()
    @IsNumberString()
    event: number;
}

export class ProductReviewCreateDto implements Dto<ProductReview> {
    @IsInt()
    productId: number;

    @IsInt()
    @Min(0)
    score: number;

    @IsString()
    @MaxLength(1000)
    comment: string;

    @IsOptional()
    @IsInt()
    parentId: number;

    @IsOptional()
    @IsString()
    @MaxLength(65535)
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

export class BlogCreateDto implements Dto<Blog> {
    @IsString()
    @MaxLength(30)
    title: string;

    @IsEnum(BlogType)
    type: BlogType;

    @IsString()
    @MaxLength(65535)
    photo: string;

    @IsString()
    @MaxLength(65535)
    contents: string;

    toEntity(): Blog {
        const blog = new Blog();
        blog.title = this.title;
        blog.type = this.type;
        blog.photo = this.photo;
        blog.contents = this.contents;
        return blog;
    }
}

export class BlogUpdateDto extends PartialType(BlogCreateDto) { }

export class BlogSearchDto extends PaginationSearchDto {
    @IsEnum(BlogType)
    type: BlogType;
}