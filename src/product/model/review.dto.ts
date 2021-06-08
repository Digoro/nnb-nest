import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsOptional, IsString, Max, MaxLength, Min, ValidateNested } from 'class-validator';
import { Payment } from 'src/payment/model/payment.entity';
import { ReviewPhoto } from 'src/product/model/review.entity';
import { User } from 'src/user/model/user.entity';
import { Dto } from '../../shared/model/dto';
import { PaginationSearchDto } from './../../shared/model/dto';
import { Review } from './review.entity';

export class ReviewCreateDto implements Dto<Review> {
    @IsInt()
    paymentId: number;

    @IsNumber()
    @Min(0)
    @Max(5)
    @Type(() => Number)
    score: number;

    @IsString()
    @MaxLength(2000)
    comment: string;

    @IsOptional()
    @IsInt()
    parentId: number;

    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => ReviewPhotoCreateDto)
    photos: ReviewPhoto[];

    toEntity(user: User, payment: Payment, parent?: Review): Review {
        const review = new Review();
        review.user = user;
        review.payment = payment;
        review.score = this.score;
        review.comment = this.comment;
        review.parent = parent;
        return review;
    }
}

export class ReviewUpdateDto extends PartialType(ReviewCreateDto) { }

export class ReviewSearchDto extends PaginationSearchDto {
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    productId: number;
}

export class ReviewPhotoCreateDto {
    @IsString()
    @MaxLength(65535)
    photo: string;
}