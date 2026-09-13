import { Router } from "express";
import { registerSchema, loginSchema } from "./auth.schema.js";
import { validate } from "../../middlewares/validate.js";
import {register, login} from "../auth/auth.controller.js"

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

export default router;