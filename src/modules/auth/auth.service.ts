import { prisma } from "../../config/db.js";
import { AppError } from "../../shared/errors/AppError.js"
import { hashPassword } from "../../shared/auth/password.js"

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




