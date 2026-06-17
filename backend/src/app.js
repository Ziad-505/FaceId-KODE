import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import apiRoutes from "./routes/index.js";
import { requestMeta } from "./middleware/requestMeta.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { notFound, errorHandler } from "./middleware/error.js";

export function createApp() {
  const app = express();
  app.set("trust proxy", true);

  app.use(
    cors({
      origin(origin, cb) {
        // Allow non-browser clients (no origin) and whitelisted origins.
        if (!origin || env.corsOrigins.includes(origin)) return cb(null, true);
        return cb(new Error(`Origin not allowed by CORS: ${origin}`));
      },
      credentials: true,
    })
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(requestMeta);
  app.use(requestLogger);

  app.use("/api", apiRoutes);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
