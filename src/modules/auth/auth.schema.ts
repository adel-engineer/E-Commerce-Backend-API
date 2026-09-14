import { email, z } from "zod";

export const registerSchema = z.object({
    fullName: z
    .string()
    .trim()
    .min(2, "must be at least 2 characters"),

    email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Invalid email address"),

    phone: z
    .string()
    .trim()
    .min(10, "Phone Number shuold be 10 numbers"),

    password: z
    .string()
    .min(8, "Password must be at least 8 characters")
});

export const loginSchema = z.object({
    email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Invalid email address"),

    password: z
    .string()
    .min(1, "Password is required"),
});

export const refreshSchema = z.object({
    refreshToken: z
     .string()
     .trim()
     .min(1, "Refresh token is required"),
})

