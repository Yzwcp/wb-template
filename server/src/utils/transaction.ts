import { sequelize } from '../config/database';
import { Transaction } from 'sequelize';

/**
 * 在 Sequelize 事务中执行操作
 * 用法: await withTransaction(async (t) => { ... })
 */
export async function withTransaction<T>(fn: (transaction: Transaction) => Promise<T>): Promise<T> {
  return sequelize.transaction(async (t) => {
    return fn(t);
  });
}
