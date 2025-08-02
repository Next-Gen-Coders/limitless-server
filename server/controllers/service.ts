import { Request, Response } from "express";

// Health check route
export const healthCheck = (req: Request, res: Response) => {
  res.status(200).json({
    status: "Limitless",
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
  });
};
