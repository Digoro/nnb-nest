import { IsNumberString, IsOptional } from "class-validator";

export interface Dto<T> {
    toEntity(...args: any[]): T;
}

export class PaginationSearchDto {
    @IsOptional()
    @IsNumberString()
    page: number;

    @IsOptional()
    @IsNumberString()
    limit: number;
}