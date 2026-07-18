import app from "./app";
import { config } from "./config/index";
import { connectDatabase, sequelize } from "./config/database";
import { redis } from "./config/redis";
import { startCallbackWorker } from "./config/queue";
import logger from "./utils/logger";

async function bootstrap(): Promise<void> {
  try {
    await connectDatabase();

    if (config.nodeEnv === "development") {
      await sequelize.sync();
      logger.info("Models synchronized");
    }

    // 启动回调队列 Worker
    startCallbackWorker();
    logger.info("Callback worker started");

    app.listen(config.port, () => {
      logger.info(
        `Server running at http://localhost:${config.port} [${config.nodeEnv}]`,
      );
    });
  } catch (error) {
    logger.error("Server failed to start", { error });
    process.exit(1);
  }
}

process.on("SIGINT", async () => {
  logger.info("Shutting down...");
  await redis.quit();
  await sequelize.close();
  process.exit(0);
});

bootstrap();
