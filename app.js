import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { pinoHttp } from "pino-http";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
import { errors as celebrateErrors } from "celebrate";
import cookieParser from "cookie-parser";

import announcementsRouter from "./src/routes/announcements.routes.js";
import authRoutes from "./src/routes/auth.routes.js";
import logger from "./src/logger.js";

const app = express();

app.use(pinoHttp({ logger }));

app.use(helmet());

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : [];


app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Too many requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(express.json());
app.use(cookieParser());

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "REST API",
      version: "1.0.0",
      description: "REST API documentation",
    },
    servers: [{ url: "http://localhost:3000" }],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
    },
  },
  apis: ["./src/routes/*.js"],
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/auth", authLimiter, authRoutes);
app.use("/announcements", announcementsRouter);

app.use(celebrateErrors());

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use((err, req, res, next) => {
  req.log.error(err); 

  if (err.type === "entity.parse.failed" && err.status === 400) {
    return res
      .status(400)
      .json({
        statusCode: 400,
        error: "Bad Request",
        message: "Invalid JSON format",
      });
  }
  if (err.code === "P2025")
    return res.status(404).json({ error: "Resource not found" });
  if (err.code === "P2002")
    return res.status(409).json({ error: "Unique constraint violation" });

  const statusCode = err.status || err.statusCode || 500;
  const message = statusCode === 500 ? "Internal server error" : err.message;

  return res.status(statusCode).json({ error: message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});
