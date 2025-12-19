import jwt from "jsonwebtoken";
import User from "../models/User";
import { Request, Response, NextFunction } from "express";

export const requireAuth = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ message: "No token" });

  try {
    const token = header.split(" ")[1];
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    const user = await User.findById(decoded.id);

    if (!user) return res.status(401).json({ message: "Invalid user" });
    if (!user.isVerified)
      return res.status(403).json({ message: "User not verified" });

    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};

export const requireAdmin = (req: any, res: Response, next: NextFunction) => {
  if (!req.user?.isAdmin)
    return res.status(403).json({ message: "Admin only" });
  next();
};
