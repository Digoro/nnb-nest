import { PartialType } from '@nestjs/mapped-types';
import { IsInt, IsOptional, IsString, MaxLength } from 'class-validator';
import { Dto, PaginationSearchDto } from 'src/shared/model/dto';
import { User } from 'src/user/model/user.entity';
import { Magazine } from './magazine.entity';

export class MagazineCreateDto implements Dto<Magazine> {
    @IsString()
    @MaxLength(50)
    title: string;

    @IsString()
    @MaxLength(50)
    catchphrase: string;

    @IsString()
    @MaxLength(65535)
    representationPhoto: string;

    @IsOptional()
    @IsInt()
    authorId: number;

    @IsString()
    @MaxLength(65535)
    contents: string;

    toEntity(author: User): Magazine {
        const magazine = new Magazine();
        magazine.title = this.title;
        magazine.catchphrase = this.catchphrase;
        magazine.representationPhoto = this.representationPhoto;
        magazine.author = author;
        magazine.contents = this.contents;
        return magazine;
    }
}

export class MagazineUpdateDto extends PartialType(MagazineCreateDto) { }

export class MagazineSearchDto extends PaginationSearchDto {

}