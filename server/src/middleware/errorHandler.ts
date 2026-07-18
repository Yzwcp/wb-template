import { Request, Response, NextFunction } from 'express';
import { BusinessError } from '../utils/response';
import logger from '../utils/logger';

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof BusinessError) {
    logger.warn(`${req.method} ${req.url} — ${err.message}`, { stack: err.stack });
    res.status(err.code).json({ code: err.code, data: null, message: err.message });
    return;
  }

  logger.error(`${req.method} ${req.url} — ${err.message}`, { stack: err.stack });

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    res.status(401).json({ code: 401, data: null, message: '登录已过期，请重新登录' });
    return;
  }

  // 返回真实错误信息，方便调试
  const message = process.env.NODE_ENV === 'production'
    ? '服务器内部错误'
    : err.message || '服务器内部错误';

  res.status(500).json({ code: 500, data: null, message });
}
