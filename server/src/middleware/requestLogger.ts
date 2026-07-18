import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";
import logger, { traceStorage } from "../utils/logger";
import OperationLog from "../models/OperationLog";

/** 为每个请求注入 requestId + 记录访问日志 */
export function accessLogger(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const traceId = uuidv4().replace(/-/g, '').slice(0, 10);
  const start = Date.now();
  req.requestId = traceId;
  req.traceId = traceId;

  // 拦截 response.json/send 以捕获响应体（非200时记录请求/响应体）
  let responseBody: any;
  const originalJson = res.json.bind(res);
  res.json = function(body: any) { responseBody = body; return originalJson(body); };
  const originalSend = res.send.bind(res);
  res.send = function(body: any) { responseBody = body; return originalSend(body); };

  // 在 AsyncLocalStorage 中注入 requestId，下游所有日志自动携带 traceId
  traceStorage.run({ traceId }, () => {
    res.on("finish", () => {
      const duration = Date.now() - start;
      const level = duration > 1000 ? "warn" : "info";

      logger.log(level, `${req.method} ${req.originalUrl} ${res.statusCode}`, {
        slow: duration > 1000,
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        duration,
        ip: req.ip || req.socket.remoteAddress,
        userAgent: req.get("user-agent")?.slice(0, 100),
        userId: req.user?.userId,
        contentLength: res.get("content-length"),
        reqBody: req.path.startsWith('/api/callback')
          ? '[XML callback body, see [Callback] log]'
          : safeBody(req.body),
        resBody: res.statusCode >= 400 ? safeBody(responseBody) : undefined,
      });
    });

    next();
  });
}

/** 记录数据变更操作日志到数据库 */
export function operationLogger(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const start = Date.now();

  const originalEnd = res.end;
  res.end = function (...args: any[]) {
    const duration = Date.now() - start;

    if (
      req.method !== "GET" &&
      !req.path.includes("/health") &&
      !req.path.includes("/mp/") &&
      req.user?.platform === "pc"
    ) {
      const m = req.path.split("/")[2] || "unknown";

      OperationLog.create({
        userId: req.user?.userId || undefined,
        username: req.user?.username || "anonymous",
        module: m,
        action: req.method,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip || req.socket.remoteAddress || "",
        params: JSON.stringify({
          query: req.query,
          body: safeBody(req.body),
        }).slice(0, 2000),
        result: String(res.statusCode),
        duration,
      }).catch(() => {}); // 静默失败
    }

    return originalEnd.apply(res, args);
  } as typeof res.end;

  next();
}

function safeBody(body: any): any {
  if (!body) return body;
  // 字符串（如微信回调 XML）过长时截断
  if (typeof body === 'string') {
    return body.length > 500 ? body.slice(0, 500) + '...(truncated)' : body;
  }
  const safe = { ...body };
  if (safe.password) safe.password = "***";
  if (safe.newPassword) safe.newPassword = "***";
  if (safe.oldPassword) safe.oldPassword = "***";
  if (safe.refreshToken) safe.refreshToken = "***";
  return safe;
}

