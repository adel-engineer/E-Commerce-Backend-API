import {z} from "zod";
import { Request, Response, NextFunction } from "express";
import { AppError } from "../shared/errors/AppError.js";

export const validate = (schema: z.ZodType) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const result = schema.safeParse(req.body);

        if (!result.success){
            const details = result.error.issues.map((issue) => ({
                 field: issue.path.join("."),
                 issue: issue.message,
                }))
            throw new AppError(
                "VALIDATION_ERROR",
                400,
                "Invalid request data",
                details
            );
        }
        next()
    }
}