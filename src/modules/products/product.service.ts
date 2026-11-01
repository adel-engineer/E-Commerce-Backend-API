import { prisma } from "../../config/db.js";

import { type createProductInput,
             type paginationInput
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