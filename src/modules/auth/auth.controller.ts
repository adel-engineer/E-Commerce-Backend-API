import {Request, Response} from "express"
import { register as registerUser } from "./auth.service.js";

export const register = async (req: Request, res: Response) => {
  const user = await registerUser(req.body);

  
    res.status(201).json({
     message: "Register controller reached",
     data:user,
  });
}
