export class Error {
    constructor(
        public code: string,
        public message: string,
        public type = 'NNB_ERROR_TYPE'
    ) { }
}