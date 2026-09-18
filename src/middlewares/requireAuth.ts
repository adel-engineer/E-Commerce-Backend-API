import { Request, Response, NextFunction } from "express";
import { AppError } from "../shared/errors/AppError.js";

import { jwtVerify } from "jose";
import { env } from "../config/env.js";

export const requireAuth = async (
    req: Request,
    res: Response, 
    next: NextFunction
) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        throw new AppError(
         "UNAUTHORIZED",
          401,
         "Authorization header is required"
      );
    }

    if (!authHeader.startsWith("Bearer ")) {
        throw new AppError(
            "UNAUTHORIZED",
            401,
            "Invalid authorization format"
        );
    }

    const token = authHeader.slice(7)
    //const token = authHeader.replace("Bearer ","")

    const secret = new TextEncoder().encode(env.JWT_SECRET)

    let payload;
    try{
        ({payload}= await jwtVerify(token, secret, {
            issuer: "ecommerce-api",
            audience: "ecommerce-api"
        }));
    } catch {
        throw new AppError(
            "UNAUTHORIZED",
            401,
            "Invalid access token"
        )
    }
    const {sub, role} = payload

    if(!sub){
        throw new AppError(
            "UNAUTHORIZED",
            401,
            "Invalid access token"
        )
    }

    if(role !== "CUSTOMER" && role !== "ADMIN"){
        throw new AppError(
        "UNAUTHORIZED",
        401,
        "Invalid access token"
        )
    }

    req.user = {
        id: sub,
        role: role,
    };next()
    
}
