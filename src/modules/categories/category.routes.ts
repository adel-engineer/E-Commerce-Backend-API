import { Router } from "express";
import { requireAuth} from "../../middlewares/requireAuth.js"
import { requireRole } from "../../middlewares/requireRole.js"
import { createCategory } from "./category.controller.js"

const router = Router();

router.post(
    "/create-category",
    requireAuth,
    requireRole(["ADMIN"]),
    createCategory
);

export default router;