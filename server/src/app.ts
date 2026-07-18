import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { errorHandler } from './middleware/errorHandler';
import { accessLogger, operationLogger } from './middleware/requestLogger';
import routes from './routes/index';

const app = express();

// 安全头
app.use(helmet({ crossOriginResourcePolicy: false }));

// CORS
app.use(cors({
  origin: '*',
  credentials: true,
}));

// 访问日志（最先挂载，拦截所有请求）
app.use(accessLogger);

// 请求体解析
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 微信回调需要 raw body (XML)
app.use('/api/callback', express.text({ type: '*/*', limit: '1mb' }));

// 操作日志（记录数据变更到 DB）
app.use(operationLogger);

// 静态文件（上传目录）
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API 路由
app.use('/api', routes);

// 健康检查
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 全局错误处理
app.use(errorHandler);

export default app;
