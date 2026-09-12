import { Request, Response, NextFunction } from "express";
import { AppError } from "../shared/errors/AppError.js";

export const errorHandler = (
    error: Error,
    req: Request,
    res: Response, 
    next: NextFunction
) => {
    if(error instanceof AppError) {
        return res.status(error.httpStatus).json({
            success: false,
            error: {
                code: error.code,
                message: error.message,
                details: error.details
            }
        });
    }

    return res.status(500).json({success: false, error: {code: "INTERNAL_ERROR", message: "Internal server error"}})
}