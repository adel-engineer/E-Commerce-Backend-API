import { SignJWT } from "jose";
import { env } from "../../config/env.js";

const secret = new TextEncoder().encode(env.JWT_SECRET); //UTF-8 bytes

export const generateAccessToken = async (
  userId: string,
  role: string,
) => {
  return new SignJWT({
    role,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("15m")
    .setIssuer("ecommerce-api")
    .setAudience("ecommerce-api")
    .sign(secret);
};