import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import pinoHttp from "pino-http";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import path from "path";
import { loadEnv } from "@locaguide/config";
import { logger } from "@locaguide/shared";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { requestContext } from "./middleware/requestContext";
import { standardRateLimiter } from "./middleware/rateLimit";
import { healthRouter } from "./routes/health.routes";
import { authRouter } from "./routes/auth.routes";
import { usersRouter } from "./routes/users.routes";
import { locationsRouter } from "./routes/locations.routes";
import { communityRouter } from "./routes/community.routes";
import { productsRouter } from "./routes/products.routes";
import { adminRouter } from "./routes/admin.routes";

export function createApp(): Express {
  const env = loadEnv();
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGINS.split(",").map((o) => o.trim()),
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(requestContext);
  app.use(
    pinoHttp({
      logger,
      customProps: (req) => ({ requestId: req.requestId, correlationId: req.correlationId }),
      autoLogging: { ignore: (req) => req.url === "/livez" || req.url === "/readyz" },
    }),
  );
  app.use(standardRateLimiter);

  app.use(healthRouter);

  try {
    const openapiDocument = YAML.load(path.join(__dirname, "..", "openapi.yaml"));
    app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openapiDocument));
  } catch {
    logger.warn("openapi.yaml not found - skipping /api/docs");
  }

  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/users", usersRouter);
  app.use("/api/v1/locations", locationsRouter);
  app.use("/api/v1/community", communityRouter);
  app.use("/api/v1/products", productsRouter);
  app.use("/api/v1/admin", adminRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
