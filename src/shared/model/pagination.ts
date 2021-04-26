import { IPaginationLinks, IPaginationMeta } from 'nestjs-typeorm-paginate';

export class PaginationWithChildren<T> {
    constructor(
        public items: T[],
        public meta: PaginationMeta,
        public links?: IPaginationLinks,
    ) { }
}

export class PaginationMeta implements IPaginationMeta {
    totalItemsWithChildren: number;
    itemCount: number;
    totalItems: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
}
