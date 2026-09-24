import { Router } from "express";
import { registerSchema, loginSchema, refreshSchema, logoutSchema } from "./auth.schema.js";
import { validate } from "../../middlewares/validate.js";
import {register, login, refresh, logout, logoutAll} from "../auth/auth.controller.js"
import { requireAuth } from "../../middlewares/requireAuth.js"


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

export default router;