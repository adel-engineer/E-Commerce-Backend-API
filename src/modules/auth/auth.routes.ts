import { Router } from "express";
import { registerSchema } from "./auth.schema.js";
import { validate } from "../../middlewares/validate.js";
import {register} from "../auth/auth.controller.js"

const router = Router();

router.post(
    "/register",
    validate(registerSchema),
    register
);

export default router;