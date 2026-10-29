import { prisma } from "../../config/db.js";
import type { categoryInput } from "./category.schema.js"
import {AppError} from "../../shared/errors/AppError.js"


export const categoryService = async(
    data: categoryInput
) => {
    const category = await prisma.category.findUnique({
        where: {
            slug: data.slug,
        },
    })
    if(category){
        throw new AppError(
            "CATEGORY_ALREADY_EXISTS",
              409,
              "category is already existing"

        )
    }

    if(data.parentId){
     const parent = await prisma.category.findUnique({
        where: {
            id: data.parentId,
        },
        include: {
            parent:{
                include: {
                    parent: true
                }
            }
        }
     })
     if(!parent || parent.deletedAt){
        throw new AppError(
            "PARENT_CATEGORY_NOT_FOUND",
            409,
            "parent category is not there"
        )
     }

     if(parent.parent?.parent) {
        throw new AppError(
         "CATEGORY_MAX_DEPTH_EXCEEDED",
         400,
         "Category hierarchy cannot exceed 3 levels"
    );
}
    }

    const newCategory = await prisma.category.create({
        data: {
            name: data.name,
            slug: data.slug,
            description: data.description,
            parentId: data.parentId,
            displayOrder: data.displayOrder,
        },
    })
    
    return newCategory
}
