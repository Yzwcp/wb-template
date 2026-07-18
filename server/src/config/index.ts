import * as dotenv from "dotenv";
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "3000"),
  nodeEnv: process.env.NODE_ENV || "development",

  db: {
    host: process.env.DB_HOST || "127.0.0.1",
    port: parseInt(process.env.DB_PORT || "3306"),
    database: process.env.DB_NAME || "***",
    username: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
  },

  redis: {
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: parseInt(process.env.REDIS_PORT || "6379"),
    password: process.env.REDIS_PASSWORD || "",
    keyPrefix: process.env.REDIS_KEY_PREFIX || "template-",
  },

  jwt: {
    secret: process.env.JWT_SECRET || "default-secret-change-me",
    accessExpiresIn: "1d",
    refreshExpiresIn: "7d",
  },

  storage: {
    type: (process.env.STORAGE_TYPE as "local" | "oss") || "local",
    localPath: process.env.STORAGE_LOCAL_PATH || "./uploads",
    oss: {
      region: process.env.OSS_REGION || "oss-cn-hangzhou",
      accessKeyId: process.env.OSS_ACCESS_KEY_ID || "",
      accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET || "",
      bucket: process.env.OSS_BUCKET || "",
    },
  },

  wechat: {
    appId: process.env.WECHAT_APPID || "",
    secret: process.env.WECHAT_SECRET || "",
  },

  log: {
    level: process.env.LOG_LEVEL || "debug",
    dir: process.env.LOG_DIR || "./logs",
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000"),
    max: parseInt(process.env.RATE_LIMIT_MAX || "100"),
  },
};
