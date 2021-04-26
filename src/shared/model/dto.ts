import { Type } from "class-transformer";
import { IsNumber } from "class-validator";

export interface Dto<T> {
    toEntity(...args: any[]): T;
}

export class PaginationSearchDto {
    @IsNumber()
    @Type(() => Number)
    page: number;

    @IsNumber()
    @Type(() => Number)
    limit: number;
}