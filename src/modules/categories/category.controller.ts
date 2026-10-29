import type { Request, Response, NextFunction } from "express";
import { categorySchema } from "./category.schema.js"
import { categoryService } from "./category.service.js"


export const createCategory = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try{
    const result = categorySchema.safeParse(req.body)
     if(result.success){
        const category = await categoryService(result.data)
           return res.status(201).json({
            message: "Category created successfully",
            data: category
            })
     } else{
        return res.status(400).json({
            message: "Validation failed",
            errors: result.error
        })
     }

    } catch (error) {
        next(error)
    }
}