import { Router } from "express";
import { requireAuth} from "../../middlewares/requireAuth.js"
import { requireRole } from "../../middlewares/requireRole.js"
import { createProduct } from "./product.controller.js"


const router = Router();

router.post(
    "/create-product",
    requireAuth,
    requireRole(["ADMIN"]),
    createProduct
);

export default router;