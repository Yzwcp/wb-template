import { Sequelize } from "sequelize-typescript";
import { config } from "./index";
import path from "path";
import logger from "../utils/logger";

export const sequelize = new Sequelize({
  host: config.db.host,
  port: config.db.port,
  database: config.db.database,
  username: config.db.username,
  password: config.db.password,
  dialect: "mysql",
  // logging:
  //   config.nodeEnv === "development"
  //     ? (sql: string) => {
  //         // 简洁日志
  //         if (sql.length > 200) sql = sql.substring(0, 200) + "...";
  //         console.log("[SQL]", sql);
  //       }
  //     : false,
  logging: (sql: string, timing?: number) => {
    if (timing && timing > 1000) {
      logger.warn(`[SQL] Slow query (${timing}ms): ${sql.slice(0, 200)}`);
    } else if (config.nodeEnv === "development") {
      // logger.debug(`[SQL] ${sql.slice(0, 150)}`);
    }
  },
  models: [
    path.join(__dirname, "../models/**/*.ts"),
    path.join(__dirname, "../models/**/*.js"),
  ],
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true,
  },
  dialectOptions: {
    dateStrings: true,
    typeCast: true,
    decimalNumbers: true,
  },
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  timezone: "+08:00",
});

export async function connectDatabase(): Promise<void> {
  try {
    await sequelize.authenticate();

    logger.info("[DB] MySQL connected successfully");
    // await syncDatabase();
  } catch (error) {
    logger.error("[DB] Unable to connect to MySQL", { error });
    throw error;
  }
}
export async function syncDatabase() {
  logger.info("[DB] 开始同步");
  // await sequelize.sync({ alter: true });
  logger.info("[DB] 同步完成");
}
