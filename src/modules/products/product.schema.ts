import { z } from "zod";

const productVariantSchema = z.object({
    sku: z.string().trim().min(1, "SKU is required"),
    price: z.number().positive("Price must be greater than zero"),
    stockQuantity: z.number().int() .min(0, "Stock cannot be negative"),
    currencyCode: z.string().length(3, "Currency code must be 3 characters")
});

export const productSchema = z.object({
  name: z.string().trim().min(1, "Product name is required"),
  slug: z.string().trim().min(1, "Product slug is required"),
  description: z.string().trim().min(1, "Description is required"),
  categoryId: z.string().uuid("Invalid category ID"),
  brandId: z.string().uuid("Invalid brand ID").optional(),
  variants: z.array(productVariantSchema).min(1, "At least one variant is required"),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10)
});

export const productIdSchema = z.object({
  id: z.string().uuid("Invalid product ID")
})

export type createProductInput = z.infer<typeof productSchema>
export type paginationInput = z.infer<typeof paginationSchema>;
export type productIdInput = z.infer<typeof productIdSchema>;