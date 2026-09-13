import {Request, Response} from "express"
import { 
  register as registerUser,
  login as loginUser
 } from "./auth.service.js";


export const register = async (req: Request, res: Response) => {
  const user = await registerUser(req.body);

  
    res.status(201).json({
     message: " User Registered in successfully",
     data:user,
  });
}

export const login = async (req: Request, res: Response) => {
  const user = await loginUser({
    ...req.body,
    deviceName: req.headers["user-agent"] ?? "unknown",
    ipAddress: req.ip ?? "unknown",
  });

  
    res.status(200).json({
     message: "User logged in successfully",
     data:user,
  });
}

