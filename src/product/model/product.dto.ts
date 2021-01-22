import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsBoolean, IsDateString, IsEnum, IsInt, IsNumber, IsNumberString, IsOptional, IsString, ValidateNested } from 'class-validator';
import { AnalysisHashtag, Event, Hashtag, Product, RequestProduct } from 'src/product/model/product.entity';
import { Dto } from 'src/shared/model/dto';
import { User } from 'src/user/model/user.entity';
import { Category, ProductOption, ProductRepresentationPhoto } from './product.entity';
import { EventStatus, EventType, HashtagType, ProductStatus } from './product.interface';

export class ProductCreateDto implements Dto<Product>{
    @IsOptional()
    @IsInt()
    hostId: number;

    @IsString()
    title: string;

    @IsString()
    point: string;

    @IsOptional()
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
    categoryIds: number[];

    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => HashtagCreateDto)
    hashtags: Hashtag[];

    @ValidateNested({ each: true })
    @Type(() => HashtagCreateDto)
    analysisHashtags: AnalysisHashtag[];

    toEntity(user: User, categories: Category[], hashtags: Hashtag[], analysisHashtags?: AnalysisHashtag[]): Product {
        const product = new Product();
        product.host = user;
        product.title = this.title;
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
        product.categories = categories;
        product.hashtags = hashtags;
        product.analysisHashtags = analysisHashtags;
        return product;
    }
}

export class ProductUpdateDto extends PartialType(ProductCreateDto) { }

export class ProductRepresentationPhotoCreateDto {
    @IsInt()
    productId: number;

    @IsString()
    photo: string;

    @IsInt()
    sortOrder: number;
}

export class ProductOptionCreateDto {
    @IsInt()
    productId: number;

    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    description: string;

    @IsInt()
    price: number;

    @IsInt()
    discountPrice: number;

    @IsInt()
    minParticipants: number;

    @IsInt()
    maxParticipants: number;
}

export class CategoryCreateDto {
    @IsInt()
    productId: number;

    @IsString()
    name: string;
}

export class HashtagCreateDto {
    @IsInt()
    id: number;

    @IsString()
    name: string;

    @IsEnum(HashtagType)
    type: HashtagType;
}

export class RequestProductCreateDto implements Dto<RequestProduct> {
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

    toEntity(user: User, product: Product): RequestProduct {
        const requestProduct = new RequestProduct();
        requestProduct.user = user;
        requestProduct.product = product;
        requestProduct.numberOfPeople = this.numberOfPeople;
        requestProduct.message = this.message;
        requestProduct.isChecked = this.isChecked;
        requestProduct.checkedAt = this.checkedAt;
        return requestProduct;
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

export class EventSearchDto {
    @IsOptional()
    @IsNumberString()
    page: number;

    @IsOptional()
    @IsNumberString()
    limit: number;

    @IsOptional()
    @IsEnum(EventStatus)
    status: EventStatus;

    @IsOptional()
    @IsEnum(EventType)
    type: EventType;
}