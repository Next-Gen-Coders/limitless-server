import express, {
  Request,
  Response,
  NextFunction,
  ErrorRequestHandler,
} from "express";
import cors from "cors";
import dotenv from "dotenv";
import routes from "./routes/service";
import userRoutes from "./routes/user";
import adminRoutes from "./routes/admin";
import swapRoutes from "./routes/swap";
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middlewares
const allowedOrigins = [
  "http://localhost:5173", // Vite dev server
  "http://localhost:3000", // Alternative dev port
  "http://localhost:4173", // Vite preview
  process.env.FRONTEND_URL, // Production frontend URL
  "*", // Allow all origins for development
].filter((origin): origin is string => Boolean(origin));

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/", routes);
app.use("/user", userRoutes);
app.use("/admin", adminRoutes);
app.use("/swap", swapRoutes);

// Basic route
app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Welcome to our API v2!" });
});

// Error handling middleware - must be after routes
const errorHandler: ErrorRequestHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Handle JSON parsing errors
  if (err.type === "entity.parse.failed" || err.status === 400) {
    res.status(400).json({
      error: "Invalid JSON format",
      message: "Please check your JSON syntax",
      details: err.message,
    });
    return;
  }

  console.error("Error:", err.message);
  console.error("Stack:", err.stack);
  res.status(500).json({ error: "Internal Server Error" });
};

app.use(errorHandler);

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

export default app;
