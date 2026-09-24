import { prisma } from "../../config/db.js";
import { AppError } from "../../shared/errors/AppError.js"
import { comparePassword, hashPassword } from "../../shared/auth/password.js"
import { generateAccessToken } from "../../shared/auth/token.js"
import crypto from "node:crypto";
import { Session } from "node:inspector";
import { date } from "zod";

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

export const refresh = async ({
    refreshToken,
}: {
    refreshToken:string
}) => {
    const refreshTokenHash  =   crypto
        .createHash("sha256")
        .update(refreshToken)
        .digest("hex")

    const refresh = await prisma.refreshToken.findUnique({
        where: {
            tokenHash: refreshTokenHash
        }
    })

    if(!refresh){
        throw new AppError(
            "INVALID_REFRESH_TOKEN",
            401,
            "Invalid refresh token"
        );
    }

    if(refresh.expiresAt < new Date()){
        throw new AppError(
        "REFRESH_TOKEN_EXPIRED",
         401,
        "Refresh token has expired"
    );
    }

    if(refresh.revokedAt) {
      throw new AppError(
      "REFRESH_TOKEN_REVOKED",
       401,
      "Refresh token has been revoked"
     )
    }

    await prisma.refreshToken.update({
        where: {
            id: refresh.id,
        },
        data: {
            revokedAt: new Date()
        }
    })

    const newRefreshToken = crypto.randomBytes(32).toString("hex");

    const newRefreshTokenHash  =   crypto
        .createHash("sha256")
        .update(newRefreshToken)
        .digest("hex")

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
        
    const session = await prisma.refreshToken.create({
        data: {
            tokenHash: newRefreshTokenHash,
            userId: refresh.userId,
            deviceName: refresh.deviceName,
            ipAddress: refresh.ipAddress,
            lastUsedAt: new Date(),
            expiresAt
        },
    })

    const user = await prisma.user.findUnique({
        where: {
            id: refresh.userId
        },
    })

    if (!user) {
        throw new AppError(
        "USER_NOT_FOUND",
        401,
        "User not found"
  );
}

    const accessToken = await generateAccessToken(
        user.id,
        user.role
    )


    return{
        accessToken,
        refreshToken: newRefreshToken,
    }
}

export const logout = async ({
    refreshToken,
}: {
    refreshToken:string
}) => {
    const refreshTokenHash  =   crypto
        .createHash("sha256")
        .update(refreshToken)
        .digest("hex")

    const refresh = await prisma.refreshToken.findUnique({
        where: {
            tokenHash: refreshTokenHash
        }
    })

    if(!refresh){
        throw new AppError(
            "INVALID_REFRESH_TOKEN",
            401,
            "Invalid refresh token"
        );
    }

    await prisma.refreshToken.update({
        where: {
            id: refresh.id,
        },
        data: {
            revokedAt: new Date()
        }
    })
}

export const logoutAll = async (userId: string) => {
    await prisma.refreshToken.updateMany({
        where: {
            userId,
            revokedAt: null,
        },
        data: {
            revokedAt: new Date()
        },
    })
}

export const forgotPassword = async (email: string) => {
    const user = await prisma.user.findUnique({
        where: {
            email
        }
    })
    if(!user){
        throw new AppError(
            "INVALID_EMAIL_OR_PASSWORD",
            401,
            "Invalid email or password"
        );
    }

    const resetToken  = crypto.randomBytes(32).toString("hex");
    const resetTokenHash =  crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex")

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    await prisma.user.update({
        where: {
            id: user.id,
        },
        data:{
            forgotPasswordToken: resetTokenHash,
            forgotPasswordExpiry: expiresAt
        }
    })

    return{
        resetToken,
    }
}

export const resetPassword = async (
  token: string,
  newPassword: string
) => {
    const resetTokenHash =  crypto
        .createHash("sha256")
        .update(token)
        .digest("hex")
    
    const user = await prisma.user.findFirst({
        where: {
            forgotPasswordToken: resetTokenHash
        },
    })

    if(!user){
      throw new AppError(
         "INVALID_RESET_TOKEN",
         401,
         "Invalid or expired reset token"
        );
    }

    if (!user.forgotPasswordExpiry || user.forgotPasswordExpiry < new Date()) {
         throw new AppError(
          "INVALID_RESET_TOKEN",
           401,
          "Invalid or expired reset token"
        );
    }

    const passwordHash = await hashPassword(newPassword)

    await prisma.user.update({
     where: {
       id: user.id,
         },
     data: {
         passwordHash,
         forgotPasswordToken: null,
         forgotPasswordExpiry: null,
         },
    });

    return {
        resetTokenHash,
    };
}