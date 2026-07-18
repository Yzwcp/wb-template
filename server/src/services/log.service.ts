import OperationLog from '../models/OperationLog';
import LoginLog from '../models/LoginLog';
import { Op } from 'sequelize';

interface LogQueryParams {
  page: number;
  pageSize: number;
  username?: string;
  module?: string;
  startDate?: string;
  endDate?: string;
}

class LogService {
  /** 获取操作日志列表 */
  async getOperationLogs(params: LogQueryParams) {
    const { page, pageSize, username, module, startDate, endDate } = params;
    const where: any = {};

    if (username) {
      where.username = { [Op.like]: `%${username}%` };
    }
    if (module) {
      where.module = { [Op.like]: `%${module}%` };
    }
    if (startDate && endDate) {
      where.created_at = {
        [Op.between]: [new Date(startDate), new Date(endDate + ' 23:59:59')],
      };
    } else if (startDate) {
      where.created_at = { [Op.gte]: new Date(startDate) };
    } else if (endDate) {
      where.created_at = { [Op.lte]: new Date(endDate + ' 23:59:59') };
    }

    const { count, rows } = await OperationLog.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      offset: (page - 1) * pageSize,
      limit: pageSize,
    });

    return { list: rows, total: count, page, pageSize };
  }

  /** 清空操作日志 */
  async clearOperationLogs() {
    await OperationLog.destroy({ where: {}, truncate: true });
  }

  /** 获取登录日志列表 */
  async getLoginLogs(params: LogQueryParams) {
    const { page, pageSize, username, startDate, endDate } = params;
    const where: any = {};

    if (username) {
      where.username = { [Op.like]: `%${username}%` };
    }
    if (startDate && endDate) {
      where.created_at = {
        [Op.between]: [new Date(startDate), new Date(endDate + ' 23:59:59')],
      };
    } else if (startDate) {
      where.created_at = { [Op.gte]: new Date(startDate) };
    } else if (endDate) {
      where.created_at = { [Op.lte]: new Date(endDate + ' 23:59:59') };
    }

    const { count, rows } = await LoginLog.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      offset: (page - 1) * pageSize,
      limit: pageSize,
    });

    return { list: rows, total: count, page, pageSize };
  }

  /** 清空登录日志 */
  async clearLoginLogs() {
    await LoginLog.destroy({ where: {}, truncate: true });
  }
}

export default new LogService();
