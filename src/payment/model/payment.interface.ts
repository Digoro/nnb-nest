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
    DIRECT = "DIRECT"
}

export interface PaypleUserDefine {
    phoneNumber: string,
    userId: number,
    mid: number,
    couponId: number,
    options: { oid: number, name: string, price: number, optionCount: number, optionDate: string }[]
}