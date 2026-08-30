export class AppError extends Error {
    constructor(
        public code: string,
        public httpStatus: number,
        message: string,
        public details?: string
    ){
        super(message)
    }
}