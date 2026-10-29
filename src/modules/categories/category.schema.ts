import { z } from "zod";

export const categorySchema = z.object({
    name: z.string().trim().min(1,"name is required"),
    slug: z.string().trim().min(1,"slug is required").regex(/^[a-z0-9-]+$/),
    description: z.string().optional(),
    parentId: z.string().uuid().optional(),
    displayOrder: z.int().min(0).optional().default(0)
})

export type categoryInput = z.infer<typeof categorySchema>
