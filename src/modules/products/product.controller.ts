import type { Request, Response, NextFunction } from "express";


import { productSchema } from "./product.schema.js"
import { createProductService } from "./product.service.js"
import { paginationSchema } from "./product.schema.js";
import { productIdSchema } from "./product.schema.js";
import { getProductByIdService } from "./product.service.js"
import { getAllProductsService } from "./product.service.js";
import { updateProductSchema } from "./product.schema.js";
import { updateProductService } from "./product.service.js";

export const createProduct = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const data = productSchema.parse(req.body)
        const product = await createProductService(data)
        
            res.status(201).json({
            message: "Product created successfully",
            data: product
        });

    } catch(error) {
        next(error)
    }
}

export const getAllProducts = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { page, limit } = paginationSchema.parse(req.query)
         const result = await getAllProductsService ({
           page,
           limit
        });

        res.status(200).json({
            message: "Products retrieved successfully",
            data: result
        })
    } catch(error){
        next(error)
    }
}

export const getProductById = async(
    req: Request,
    res: Response,
    next: NextFunction
) :Promise<void> => {
    try{
        const { id } = productIdSchema.parse(req.params);
        const productId = await getProductByIdService(id)

             res.status(200).json({
             message: "Product retrieved successfully",
             data: productId })

    } catch(error){
        next(error)
    }
}

export const updateProduct = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { id } = productIdSchema.parse(req.params);
        const data = updateProductSchema.parse(req.body);
        const product = await updateProductService(id, data);

        res.status(200).json({
          message: "Product updated successfully",
          data: product
});
    } catch (error) {
        next(error);
    }
};