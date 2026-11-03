import { prisma } from "../../config/db.js";
import { AppError } from "../../shared/errors/AppError.js";
import { Prisma } from "../../generated/prisma/client.js";
import { type createProductInput,
         type paginationInput,
         type updateProductInput

 } from "./product.schema.js";

export const createProductService = async (
    data: createProductInput
) => {
    const product = await prisma.product.create({
    data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        categoryId: data.categoryId,
        brandId: data.brandId,

        variants: {
            create: data.variants
        }
    },
    include: {variants: true}
});
    return product;
}

export const getAllProductsService = async (
    { page, limit }: paginationInput
) => {
    const skip = (page - 1) * limit

    const where = {
        isActive: true,
        deletedAt: null
    }

    // const products = await prisma.product.findMany({
    //     where,
    //     skip,
    //     take: limit,
    //     orderBy: {
    //         createdAt: "desc",
    //     },

    //     include: {
    //         category: true,
    //         brand: true,
    //         variants: true
    //     }
    // })

    // const totalProducts = await prisma.product.count({
    //     where
    // })

    const [products, totalProducts] = await Promise.all([
        prisma.product.findMany({
            where,
            skip,
            take: limit,
            orderBy: {
                createdAt: "desc"
            },include: {
                category: true,
                brand: true,
                variants: true
            }
        }),
        prisma.product.count({
            where
        })
    ])

    const totalPages = Math.ceil(totalProducts / limit);

    return {
        products,
        pagination: {
            page,
            limit,
            totalProducts,
            totalPages,
        }
    }
}

export const getProductByIdService = async (id: string) => {
    const product = await prisma.product.findFirst({
        where: {
            id:id,
            isActive: true,
            deletedAt: null
        },
        include: {
            category: true,
            brand: true,
            variants: true
        }
    })

    if(!product) {
        throw new AppError(
            "PRODUCT_NOT_FOUND",
            404,
            "Product not found"
        )
    }

    return product;
}

export const updateProductService = async (
    id: string,
    data: updateProductInput
) => {
    try {
        const product = await prisma.product.update({
            where: { id },
            data
        });

        return product;

    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {

            if (error.code === "P2025") {
                throw new AppError(
                    "PRODUCT_NOT_FOUND",
                    404,
                    "Product not found"
                );
            }

            if (error.code === "P2002") {
                throw new AppError(
                    "DUPLICATE_SLUG",
                    409,
                    "Slug already exists"
                );
            }
        }

        throw error;
    }
};

export const deleteProductService = async (id: string) => {
    try{
        const product = await prisma.product.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                isActive: false
            }
        });
        return product
    }catch(error){
    if (error instanceof Prisma.PrismaClientKnownRequestError) {

        if (error.code === "P2025") {
            throw new AppError(
                "PRODUCT_NOT_FOUND",
                404,
                "Product not found"
            );
        }
    }
    throw error;
    }
}