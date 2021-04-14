export class ErrorInfo {
    constructor(
        public code: string,
        public id: string,
        public message: string,
        public reason?: any,
        public type = 'NNB_ERROR_TYPE'
    ) { }
}