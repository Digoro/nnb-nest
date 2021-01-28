import { PartialType } from '@nestjs/mapped-types';
import { IsInt, IsOptional, IsString } from 'class-validator';
import { Dto, PaginationSearchDto } from 'src/shared/model/dto';
import { User } from 'src/user/model/user.entity';
import { Magazine } from './magazine.entity';

export class MagazineCreateDto implements Dto<Magazine> {
    @IsString()
    title: string;

    @IsString()
    catchphrase: string;

    @IsString()
    representationPhoto: string;

    @IsOptional()
    @IsInt()
    authorId: number;

    @IsString()
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