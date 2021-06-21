export enum PG {
    NAVER = "NAVER",
    KAKAO = "KAKAO",
    PAYPLE = "PAYPLE"
}

export enum PayMethod {
    BANKBOOK = "BANKBOOK",
    CARD = "CARD",
    TRANSFER = "TRANSFER",
    DIRECT_CARD = "DIRECT_CARD",
    DIRECT_TRANSFER = "DIRECT_TRANSFER",
    FREE = "FREE"
}

export interface PaypleUserDefine {
    phoneNumber: string,
    userId: number,
    userEmail: string,
    userName: string,
    mid: number,
    couponId: number,
    options: { id: number, name: string, price: number, count: number, date: string }[],
    alliance: string
}