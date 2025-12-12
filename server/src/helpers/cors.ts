import { LOGGER } from "src/log/logger";
import { ALLOW_ORIGINS } from "src/utils/allowOrigins";

export const corsOptions = ({
    origin: (origin: string | undefined, callback: any) => {
      if (!origin) return callback(null, true);
      if (ALLOW_ORIGINS.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(LOGGER.error("CORS policy violation: Origin not allowed - " + origin), false);
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })

