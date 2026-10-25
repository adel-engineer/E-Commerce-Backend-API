import { prisma } from "../../config/db.js";
import type { createProductInput } from "./product.schema.js";


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