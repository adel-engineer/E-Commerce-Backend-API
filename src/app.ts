import express from "express"
import helmet from "helmet";
//import cors from "cors";
import { errorHandler } from "./middlewares/errorHandler.js";
//Auth Router
import authRoutes from "./modules/auth/auth.routes.js";


const app = express();

app.use(helmet());
app.use(express.json());
// Auth Router
app.use("/api/auth", authRoutes);

// app.use(cors({
//     origin: env.CLIENT_URL,
// }))

app.use(errorHandler);
export default app;