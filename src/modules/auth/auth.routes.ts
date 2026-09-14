import { Router } from "express";
import { registerSchema, loginSchema, refreshSchema } from "./auth.schema.js";
import { validate } from "../../middlewares/validate.js";
import {register, login, refresh} from "../auth/auth.controller.js"

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

export default router;