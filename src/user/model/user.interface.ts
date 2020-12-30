
export interface User {
    id?: number;
    name?: string;
    email?: string;
    password?: string;
    role?: Role
}

export enum Role {
    ADMIN = 'admin',
    EDITOR = 'editor',
    USER = 'user',
}