import { IsNumberString } from "class-validator";

export interface Dto<T> {
    toEntity(...args: any[]): T;
}

export class PaginationSearchDto {
    @IsNumberString()
    page: number;

    @IsNumberString()
    limit: number;
}