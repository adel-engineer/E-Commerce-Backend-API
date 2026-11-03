import { Router } from "express";
import { requireAuth} from "../../middlewares/requireAuth.js"
import { requireRole } from "../../middlewares/requireRole.js"
import { createProduct, getAllProducts, updateProduct, deleteProduct } from "./product.controller.js"
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

router.patch(
    "/:id",
    requireAuth,
    requireRole(["ADMIN"]),
    updateProduct
);

router.delete(
    "/:id",
    requireAuth,
    requireRole(["ADMIN"]),
    deleteProduct
);
export default router;