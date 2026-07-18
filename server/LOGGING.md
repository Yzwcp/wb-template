# 日志系统使用与排查指南

## 一、日志文件结构

所有日志文件位于 `server/logs/` 目录，按天切割。

| 文件 | 内容 | 保留时间 | 大小限制 |
|------|------|----------|----------|
| `app-YYYY-MM-DD.log` | 全量日志（所有级别） | 30 天 | 50MB 切割 |
| `error-YYYY-MM-DD.log` | 仅 `error` 级别（系统异常） | 60 天 | 50MB 切割 |
| `slow-YYYY-MM-DD.log` | 标记 `slow: true` 的慢请求 | 14 天 | 20MB 切割 |

### 日志级别说明

| 级别 | 适用场景 |
|------|----------|
| `error` | 未知系统异常（5xx）、第三方 API 调用失败、数据库连接失败 |
| `warn` | 业务校验失败（BusinessError）、慢查询/慢请求 |
| `info` | 请求出入口、订单状态变更、系统启动/关闭 |
| `debug` | 开发环境 SQL 日志**

---

## 二、JSON 日志字段

每条日志严格按照以下字段顺序输出，便于 grep 和索引：

```json
{
  "timestamp": "2026-07-18 18:10:19.073",
  "level": "info",
  "module": "Order",
  "traceId": "b9d393d943",
  "duration": 42,
  "method": "POST",
  "url": "/api/order/create",
  "status": 200,
  "ip": "::1",
  "userId": 1,
  "message": "[Order] 创建订单: OD202607180001",
  "stack": null,
  "slow": false,
  "...": "其余字段按字母序排列"
}
```

### 字段说明

| 字段 | 必含 | 说明 |
|------|------|------|
| `timestamp` | ✅ | `YYYY-MM-DD HH:mm:ss.SSS` 格式，东八区 |
| `level` | ✅ | `error` / `warn` / `info` / `debug` |
| `module` | 部分日志 | 业务模块标识（如 `Order`, `Wechat`, `Callback`, `DB`） |
| `traceId` | ✅ | 10 位十六进制串，串联整条请求链路 |
| `duration` | 请求日志 | 请求处理耗时（毫秒） |
| `method` | 请求日志 | HTTP 方法 |
| `url` | 请求日志 | 请求路径（含 query） |
| `status` | 请求日志 | HTTP 状态码 |
| `ip` | 请求日志 | 客户端 IP |
| `userId` | 已登录请求 | 操作用户 ID |
| `message` | ✅ | 日志消息正文 |
| `stack` | 异常日志 | 错误堆栈（仅 Error 对象时出现） |
| `slow` | ✅ | `true` 表示请求/操作耗时超过阈值 |
| `reqBody` | 4xx/5xx | 请求体（敏感字段已脱敏） |
| `resBody` | 4xx/5xx | 响应体（敏感字段已脱敏） |
| `userAgent` | 请求日志 | 客户端 User-Agent |

---

## 三、错误场景覆盖

| 场景 | 落地日志 | 级别 | 关键字段 |
|------|----------|------|----------|
| MySQL 连接失败 | `error-*.log` + `app-*.log` | `error` | `module: "DB"` |
| Redis 连接失败 | `error-*.log` + `app-*.log` | `error` | `module: "Redis"` |
| BullMQ Worker 异常 | `error-*.log` + `app-*.log` | `error` | `module: "Callback"` |
| 参数校验失败 | `app-*.log` | `warn` | `status: 400` |
| 权限不足 | `app-*.log` | `warn` | `status: 401/403` |
| 业务逻辑异常 | `app-*.log` | `warn` | BusinessError |
| 未知系统异常 | `error-*.log` + `app-*.log` | `error` | `status: 500` |
| 微信 API 调用失败 | `app-*.log` | `error` | `module: "Wechat"` |
| 回调订单处理异常 | `app-*.log` | `error` | `module: "Callback"` |
| 慢请求（>1s） | `slow-*.log` + `app-*.log` | `warn` | `slow: true` |
| SQL 慢查询（>1s） | `app-*.log` | `warn` | `[SQL]` 前缀 |

---

## 四、排查方法

### 4.1 查系统错误

```bash
# 今日全部 error 日志
cat logs/error-$(date +%Y-%m-%d).log | jq

# 实时追踪新的错误
tail -f logs/error-$(date +%Y-%m-%d).log | jq .
```

### 4.2 按 traceId 串联请求链路

拿到任意错误日志中的 `traceId`（如 `a1b2c3d4e5`），可以查出该请求的完整时序：

```bash
grep 'a1b2c3d4e5' logs/app-$(date +%Y-%m-%d).log
```

输出示例：

```json
{"timestamp":"...","level":"info","traceId":"a1b2c3d4e5", "message":"POST /api/order/create 200"}
{"timestamp":"...","level":"info","traceId":"a1b2c3d4e5", "message":"[Wechat] 统一下单"}
{"timestamp":"...","level":"info","traceId":"a1b2c3d4e5", "message":"[Callback] 收到 payment 通知"}
{"timestamp":"...","level":"error","traceId":"a1b2c3d4e5", "message":"支付回调处理失败"}
```

### 4.3 查慢请求

```bash
# 今天的慢请求
cat logs/slow-$(date +%Y-%m-%d).log | jq '{timestamp, duration, url, method, status}'

# 按耗时倒排
cat logs/slow-$(date +%Y-%m-%d).log | jq -r '[.duration, .url] | @tsv' | sort -rn | head -10
```

### 4.4 查错误请求的请求/响应体

```bash
# 查找状态码 5xx 的请求
grep '"status":5[0-9][0-9]' logs/app-$(date +%Y-%m-%d).log | jq '{traceId, url, status, reqBody, resBody}'
```

### 4.5 按模块过滤

```bash
# 只看订单模块
grep '"module":"Order"' logs/app-$(date +%Y-%m-%d).log | jq '{timestamp, level, message, duration}'

# 或按消息前缀
grep '\[Wechat\]' logs/app-$(date +%Y-%m-%d).log | jq '{timestamp, level, message}'
```

### 4.6 综合查询（组合 grep + jq）

```bash
# 某用户今天的所有操作
grep '"userId":42' logs/app-$(date +%Y-%m-%d).log | jq '{timestamp, level, method, url, status, duration}'

# 某段时间内的慢查询
grep '"slow":true' logs/app-$(date +%Y-%m-%d).log | jq 'select(.duration > 2000) | {timestamp, url, duration}'
```

---

## 五、高级排查技巧

### 5.1 生产环境启用 SQL 慢查询追踪

当前 `database.ts` 的 SQL 日志配置：

```typescript
logging: (sql: string, timing?: number) => {
  if (timing && timing > 1000) {
    logger.warn(`[SQL] Slow query (${timing}ms): ${sql.slice(0, 200)}`);
  } else if (config.nodeEnv === "development") {
    logger.debug(`[SQL] ${sql.slice(0, 150)}`);
  }
},
```

如需启用生产环境的慢 SQL 检测，在 Sequelize 配置中添加 `benchmark: true`：

```typescript
export const sequelize = new Sequelize({
  // ... 现有配置
  benchmark: true,        // ← 开启后才会传递 timing 参数
  logging: (sql, timing) => { ... },
});
```

### 5.2 回调/队列任务也带 traceId

当前 BullMQ Worker 处理回调时不处于 HTTP 请求上下文中，因此日志不包含 `traceId`。如需追踪，在 Worker 的 process 函数内手动包裹：

```typescript
import { traceStorage } from "../utils/logger";
import { v4 as uuidv4 } from "uuid";

worker.on("completed", (job) => {
  traceStorage.run({ traceId: uuidv4().replace(/-/g, "").slice(0, 10) }, () => {
    logger.info(`[Callback] Job ${job.id} completed: ${job.data.type}`);
  });
});
```

### 5.3 在客户端响应中带上 traceId

在 `accessLogger` 中设置响应头，方便客户端上报错误时关联：

```typescript
// requestLogger.ts
res.set("X-Request-Id", traceId);
```

---

## 六、配置项

日志相关配置通过环境变量控制（`server/.env`）：

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `LOG_LEVEL` | `debug`（开发）/ `info`（生产） | 日志级别 |
| `LOG_DIR` | `./logs` | 日志文件输出目录 |
| `NODE_ENV` | `development` | 控制日志格式（多彩 vs JSON） |

---

## 七、常见问题

**Q: 日志文件没有内容？**

A: 确认 `LOG_DIR` 配置的目录是否存在且有写入权限。Winston 会尝试自动创建，但部分环境下需手动创建。

**Q: `traceId` 为空？**

A: 确认 `accessLogger` 中间件已挂载且最先执行（`app.ts` 中 accessLogger 应在所有业务中间件之前）。

**Q: 慢请求日志文件为空？**

A: 慢请求日志只收集标记 `slow: true` 的条目。只有耗时超过 1000ms 的请求才会被标记。

**Q: 控制台输出和文件输出不一致？**

A: 开发环境控制台使用彩色可读格式，文件始终使用 JSON 格式。这是预期的行为。

**Q: `reqBody` / `resBody` 为 `undefined`？**

A: `reqBody` 总是存在（可能为空对象），`resBody` 仅在 `status >= 400` 时记录。
