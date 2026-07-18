import { AsyncLocalStorage } from "async_hooks";
import winston from "winston";
import "winston-daily-rotate-file";
import path from "path";
import { config } from "../config/index";

const { log: logConfig } = config;
const isDev = config.nodeEnv === "development";

export const traceStorage = new AsyncLocalStorage<{ traceId: string }>();

const SENSITIVE_KEYS = [
  "password",
  "token",
  "secret",
  "authorization",
  "cookie",
  "refreshToken",
  "accessToken",
];

function redact(obj: any): any {
  if (!obj || typeof obj !== "object") return obj;
  const clone = Array.isArray(obj) ? [...obj] : { ...obj };
  for (const key of Object.keys(clone)) {
    const lower = key.toLowerCase();
    if (SENSITIVE_KEYS.some((k) => lower.includes(k))) {
      clone[key] = "***REDACTED***";
    } else if (typeof clone[key] === "object") {
      clone[key] = redact(clone[key]);
    }
  }
  return clone;
}

const ORDERED_KEYS = [
  "timestamp",
  "level",
  "module",
  "traceId",
  "duration",
  "method",
  "url",
  "status",
  "ip",
  "userId",
  "message",
  "stack",
  "slow",
];


function sortKeys(obj: Record<string, any>): Record<string, any> {
  const ordered = {};
  for (const k of ORDERED_KEYS) {
    if (k in obj) ordered[k] = obj[k];
  }
  for (const k of Object.keys(obj).sort()) {
    if (!ORDERED_KEYS.includes(k)) ordered[k] = obj[k];
  }
  return ordered;
}

const injectTrace = winston.format((info) => {
  const store = traceStorage.getStore();
  if (store?.traceId) {
    info.traceId = store.traceId;
  }
  return sortKeys(info) as any;
});

const jsonFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
  winston.format.errors({ stack: true }),
  injectTrace(),
  winston.format((info) => {
    if (info.meta) info.meta = redact(info.meta);
    return info;
  })(),
  winston.format.printf((info) => {
    const ordered: Record<string, any> = {};
    for (const k of ORDERED_KEYS) {
      if (k in info && info[k] !== undefined) ordered[k] = info[k];
    }
    for (const k of Object.keys(info).sort()) {
      if (!ORDERED_KEYS.includes(k)) ordered[k] = info[k];
    }
    return JSON.stringify(ordered);
  }),
);

const devFormat = winston.format.combine(
  winston.format.timestamp({ format: "MM-DD HH:mm:ss.SSS" }),
  winston.format.errors({ stack: true }),
  winston.format.colorize(),
  injectTrace(),
  winston.format.printf(
    ({
      timestamp,
      level,
      message,
      stack,
      traceId,
      module,
      duration,
      ...meta
    }) => {
      const tid = traceId ? ` [${String(traceId).slice(0, 8)}]` : "";
      const mod = module ? ` ${module}` : "";
      const dur = duration ? ` ${duration}ms` : "";
      const metaStr = (() => {
        const keys = Object.keys(meta).filter(
          (k) =>
            !SENSITIVE_KEYS.includes(k) && k !== "timestamp" && k !== "level",
        );
        return keys.length ? " " + JSON.stringify(redact(meta)) : "";
      })();
      return `${timestamp} ${level}${tid}${mod}${dur} ${stack || message}${metaStr}`;
    },
  ),
);

const logger = winston.createLogger({
  level: logConfig.level || (isDev ? "debug" : "info"),
  transports: [
    new winston.transports.Console({
      format: isDev ? devFormat : jsonFormat,
    }),
    new winston.transports.DailyRotateFile({
      filename: path.resolve(logConfig.dir, "app-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      maxSize: "50m",
      maxFiles: "30d",
      format: jsonFormat,
    }),
    new winston.transports.DailyRotateFile({
      filename: path.resolve(logConfig.dir, "error-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      level: "error",
      maxSize: "50m",
      maxFiles: "60d",
      format: jsonFormat,
    }),
    new winston.transports.DailyRotateFile({
      filename: path.resolve(logConfig.dir, "slow-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      maxSize: "20m",
      maxFiles: "14d",
      format: winston.format.combine(
        winston.format((info) => (info.slow ? info : false))(),
        jsonFormat,
      ),
    }),
  ],
});

export function createRequestLogger(requestId: string) {
  return logger.child({ traceId: requestId });
}

export function logDuration(
  module: string,
  action: string,
  durationMs: number,
  threshold: number = 1000,
  extra?: Record<string, any>,
) {
  const level = durationMs > threshold ? "warn" : "info";
  const entry = {
    module,
    duration: durationMs,
    slow: durationMs > threshold,
    ...extra,
  };
  logger.log(level, `[${module}] ${action} (${durationMs}ms)`, entry);
}

export default logger;
export { logConfig };
