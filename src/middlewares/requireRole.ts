import { Request, Response, NextFunction } from "express";
//import { Role } from "@prisma/client";

import { AppError } from "../shared/errors/AppError.js";

type Role = "CUSTOMER" | "ADMIN"; // I should replace it that caz the prisma 7 still have problem 

export const requireRole = (roles: Role[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {

    const user = req.user;

    if (!user) {
      throw new AppError(
        "UNAUTHORIZED",
        401,
        "Authentication required"
      );
    }

    if (!roles.includes(user.role)) {
      throw new AppError(
        "FORBIDDEN",
        403,
        "You do not have permission to perform this action"
      );
    }

    next();
  };
};