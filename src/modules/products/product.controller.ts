import type { Request, Response, NextFunction } from "express";
import { productSchema } from "./product.schema.js"
//import { createProductService } from "./product.service.js"


export const createProduct = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const data = productSchema.parse(req.body)
       // const product = await createProductService(data)
    } catch(error) {
        next(error)
    }
}