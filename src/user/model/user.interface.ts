
export interface User {
    id: number;
    name: string;
    email: string;
    password: string;
    role: Role
}

export enum Role {
    Admin = 'admin',
    Editor = 'editor',
    User = 'user',
}