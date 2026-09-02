import express from "express"
import helmet from "helmet";
//import cors from "cors";
import { errorHandler } from "./middlewares/errorHandler.js";
import { AppError } from "./shared/errors/AppError.js";
const app = express();

app.use(helmet());
app.use(express.json());

// app.use(cors({
//     origin: env.CLIENT_URL,
// }))

app.get("/test-error",  (req,res) => {
    throw new AppError(
    "NOT_FOUND",
    404,
    "Product not found"
    )
})
app.use(errorHandler);
export default app;