import { Product } from './../../product/model/product.interface';
export interface User {
    id: number;
    name: string;
    email: string;
    password: string;
    role: Role;
    products?: Product[];
}

export enum Role {
    ADMIN = 'admin',
    EDITOR = 'editor',
    USER = 'user',
}