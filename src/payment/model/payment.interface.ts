export enum PG {
    NAVER = "NAVER",
    KAKAO = "KAKAO",
    PAYPLE = "PAYPLE"
}

export enum PayMethod {
    BANKBOOK = "BANKBOOK",
    POINT = "POINT",
    CARD = "CARD",
    TRANSFER = "TRANSFER",
    DIRECT = "DIRECT",
    FREE = "FREE"
}

export interface PaypleUserDefine {
    phoneNumber: string,
    userId: number,
    mid: number,
    couponId: number,
    options: { id: number, name: string, price: number, count: number, date: string }[]
}