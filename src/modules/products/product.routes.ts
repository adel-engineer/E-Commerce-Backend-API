import { Router } from "express";
import { requireAuth} from "../../middlewares/requireAuth.js"
import { requireRole } from "../../middlewares/requireRole.js"
import { createProduct, getAllProducts } from "./product.controller.js"
import { getProductById } from "./product.controller.js";


const router = Router();

router.post(
    "/",
    requireAuth,
    requireRole(["ADMIN"]),
    createProduct
);

router.get(
    "/",
    getAllProducts
)

router.get(
    "/:id",
     getProductById);

export default router;