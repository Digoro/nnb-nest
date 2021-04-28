export enum ProductStatus {
    ALL = 'ALL',
    TEST = 'TEST',
    ENTERED = 'ENTERED',
    DISABLED = 'DISABLED',
}

export enum HashtagType {
    PRODUCT = 'PRODUCT',
    USER = 'USER'
}

export enum EventType {
    ALL = 'ALL',
    PROMOTION = 'PROMOTION',
    SURVEY = 'SURVEY',
}

export enum EventStatus {
    ALL = 'ALL',
    CREATED = 'CREATED',
    RUNNING = 'RUNNING',
    END = 'END',
}

export enum BlogType {
    ALL = 'ALL',
    NOTICE = 'NOTICE', // 공지사항, 새로운 소식
    INFO = 'INFO', // 유용한 정보, 노는법 소개
    INTERVIEW = 'INTERVIEW', // 고객 인터뷰, 내부 인터뷰
}