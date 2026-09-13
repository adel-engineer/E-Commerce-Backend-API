import { prisma } from "../../config/db.js";
import { AppError } from "../../shared/errors/AppError.js"
import { comparePassword, hashPassword } from "../../shared/auth/password.js"
import { generateAccessToken } from "../../shared/auth/token.js"
import { email, string } from "zod";
import crypto from "node:crypto";
import { Role } from "../../generated/prisma/enums.js";
import { ro } from "zod/v4/locales";

export const register = async ({
  fullName,
  email,
  phone,
  password,
}: {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}) => {
    const existingUser = await prisma.user.findUnique({
        where: {email}
    })

    if(existingUser){
        throw new AppError (
            "EMAIL_ALREADY_EXISTS",
            409,
            "Email is already registered"

        )
    }

    const existingPhone  = await prisma.user.findUnique({
        where: {phone},
    })

    if(existingPhone){
        throw new AppError(
             "PHONE_ALREADY_EXISTS",
              409,
              "Phone number is already registered"

        )
    }

    const passwordHash = await hashPassword(password)

    const user = await prisma.user.create({
        data: {
            fullName,
            email,
            passwordHash,
            phone,
            role: "CUSTOMER",
        }
    })

    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
}
}

export const login = async ({
    email,
    password,
    deviceName,
    ipAddress
}: {
    email: string,
    password: string,
    deviceName: string,
    ipAddress: string
}) => {
    const user  = await prisma.user.findUnique({
        where: {
            email,
        },
    })

    if(!user){
        throw new AppError(
            "INVALID_CREDENTIALS",
            401,
            "Invalid email or password"
        )
    }

    const isPasswordValid = await comparePassword(
        password, user.passwordHash)


    if (!isPasswordValid) {
         throw new AppError(
          "INVALID_CREDENTIALS",
            401,
          "Invalid email or password"
        );
    }

    const accessToken = await generateAccessToken(
        user.id,
        user.role
    )

    const refreshToken = crypto.randomBytes(32).toString("hex");

    const refreshTokenHash  =   crypto
        .createHash("sha256")
        .update(refreshToken)
        .digest("hex")

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);


    const session = await prisma.refreshToken.create({
        data: {
            tokenHash: refreshTokenHash,
            userId: user.id,
            deviceName,
            ipAddress,
            lastUsedAt: new Date(),
            expiresAt,
        },
    })

    return{
        accessToken,
        refreshToken,
        user: {
            fullName: user.fullName,
            id: user.id,
            email: user.email,
            phone: user.phone,
            role: user.role,
        },
    }
}





