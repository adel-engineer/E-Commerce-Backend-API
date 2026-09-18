import {Request, Response} from "express"
import { 
  register as registerUser,
  login as loginUser,
  refresh as refreshUser,
  logout as logoutUser,
  logoutAll as logoutAllUsers
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

export const refresh = async (req: Request, res: Response) => {
  const tokens = await refreshUser(req.body);

  res.status(200).json({
    message: "Token refreshed successfully",
    data: tokens
  })
}


export const logout = async (req: Request, res: Response) => {
  const result  = await logoutUser(req.body);

  res.status(200).json({
    message: "User logged out successfully",
    data: result 
  })
}


export const logoutAll = async (req: Request, res: Response) => {
  await logoutAllUsers(req.user!.id);

  res.status(200).json({
    message: "Logged out from all devices successfully",
  });
};