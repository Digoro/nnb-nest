
export interface Dto<T> {
    toEntity(...args: any[]): T;
}