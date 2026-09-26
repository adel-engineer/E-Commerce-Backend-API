import { Router } from "express";
import { registerSchema, loginSchema, refreshSchema, logoutSchema, forgotPasswordSchema, resetPasswordSchema } from "./auth.schema.js";
import { validate } from "../../middlewares/validate.js";
import {register, login, refresh, logout, logoutAll, forgotPassword, resetPassword} from "../auth/auth.controller.js"
import { requireAuth} from "../../middlewares/requireAuth.js"
// import { requireRole } from "../../middlewares/requireRole.js"





const router = Router();

router.post(
    "/register",
    validate(registerSchema),
    register
);

router.post(
    "/login",
    validate(loginSchema),
    login
)

router.post(
    "/refresh",
    validate(refreshSchema),
    refresh
)

router.post(
  "/logout",
  validate(logoutSchema),
  logout
)

router.post(
    "/logout-All",
    requireAuth,
    logoutAll
)

router.post(
    "/forgot-password",
    validate(forgotPasswordSchema),
    forgotPassword
)

router.post(
    "/resetPassword/:token",
    validate(resetPasswordSchema),
    resetPassword
)


export default router;