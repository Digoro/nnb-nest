import { Product } from './../../product/model/product.interface';

export interface User {
    id: number;
    email: string;
    password: string;
    name: string;
    phoneNumber: string;
    provider: string;
    thirdpartyId: string;
    points: number;
    birthday: Date;
    nickname: string;
    gender: Gender;
    profilePhoto: string;
    catchphrase: string;
    introduction: string;
    role: Role;
    createdAt: Date;
    updatedAt: Date;
    products?: Product[];
}

export enum Gender {
    MALE = "male",
    FEMALE = "female",
    OTHER = "other"
}

export enum Role {
    ADMIN = 'admin',
    EDITOR = 'editor',
    USER = 'user',
}