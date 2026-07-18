import GlobalConfig, { WechatAppConfig, OssConfig } from '../models/GlobalConfig';
import { BusinessError } from '../utils/response';
import { redis } from '../config/redis';
import logger from '../utils/logger';
import { Transaction } from 'sequelize';
import { sequelize } from '../config/database';

const ACTIVE_CONFIG_CACHE_KEY = 'global:config:active';
const CACHE_TTL = 3600; // 1 hour

class GlobalConfigService {
  /** 获取配置列表 */
  async getList() {
    const list = await GlobalConfig.findAll({
      order: [
        ['isActive', 'DESC'],
        ['createdAt', 'DESC'],
      ],
    });
    return list;
  }

  /** 获取当前启用的配置（带缓存） */
  async getActive() {
    const cached = await redis.get(ACTIVE_CONFIG_CACHE_KEY);
    if (cached) {
      logger.debug('[GlobalConfig] 从缓存获取启用的配置');
      return JSON.parse(cached);
    }

    const config = await GlobalConfig.findOne({
      where: { isActive: 1 },
    });

    if (config) {
      await redis.setex(
        ACTIVE_CONFIG_CACHE_KEY,
        CACHE_TTL,
        JSON.stringify(config.toJSON()),
      );
      logger.info('[GlobalConfig] 已缓存启用的配置');
      return config.toJSON();
    }

    return null;
  }

  /** 获取启用的微信小程序配置 */
  async getWechatConfig(): Promise<WechatAppConfig | null> {
    const active = await this.getActive();
    return active?.wechatConfig ?? null;
  }

  /** 获取启用的 OSS 配置 */
  async getOssConfig(): Promise<OssConfig | null> {
    const active = await this.getActive();
    return active?.ossConfig ?? null;
  }

  /** 设置指定配置为启用（同时只能启用一个） */
  async setActive(id: number) {
    const transaction: Transaction = await sequelize.transaction();

    try {
      await GlobalConfig.update({ isActive: 0 }, { where: {}, transaction });

      const config = await GlobalConfig.findByPk(id, { transaction });
      if (!config) {
        throw new BusinessError(400, '配置不存在');
      }

      await config.update({ isActive: 1 }, { transaction });
      await transaction.commit();

      // 直接写入 Redis 缓存
      const configData = config.toJSON();
      await redis.setex(ACTIVE_CONFIG_CACHE_KEY, CACHE_TTL, JSON.stringify(configData));
      logger.info(`[GlobalConfig] 已激活并缓存配置: ${config.name}`);

      return config;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /** 创建配置 */
  async create(data: {
    name: string;
    isActive?: boolean;
    wechatConfig?: WechatAppConfig | null;
    ossConfig?: OssConfig | null;
    remark?: string;
  }) {
    // 如果要创建为启用状态，先停用其他
    if (data.isActive) {
      await GlobalConfig.update({ isActive: 0 }, { where: {} });
    }

    const config = await GlobalConfig.create({
      name: data.name,
      isActive: data.isActive ? 1 : 0,
      wechatConfig: data.wechatConfig ?? null,
      ossConfig: data.ossConfig ?? null,
      remark: data.remark,
    } as any);

    // 如果创建为启用，清除旧缓存
    if (data.isActive) {
      await redis.del(ACTIVE_CONFIG_CACHE_KEY);
    }

    logger.info(`[GlobalConfig] 创建配置: ${config.name}`);
    return config;
  }

  /** 更新配置 */
  async update(id: number, data: {
    name?: string;
    isActive?: boolean;
    wechatConfig?: WechatAppConfig | null;
    ossConfig?: OssConfig | null;
    remark?: string;
  }) {
    const config = await GlobalConfig.findByPk(id);
    if (!config) {
      throw new BusinessError(400, '配置不存在');
    }

    // 如果要启用，先停用其他
    if (data.isActive) {
      await GlobalConfig.update({ isActive: 0 }, { where: {} });
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.isActive !== undefined) updateData.isActive = data.isActive ? 1 : 0;
    if (data.wechatConfig !== undefined) updateData.wechatConfig = data.wechatConfig;
    if (data.ossConfig !== undefined) updateData.ossConfig = data.ossConfig;
    if (data.remark !== undefined) updateData.remark = data.remark;

    await config.update(updateData);

    // 清除缓存
    await redis.del(ACTIVE_CONFIG_CACHE_KEY);
    logger.info(`[GlobalConfig] 更新配置: ${config.name}`);

    return config;
  }

  /** 删除配置 */
  async remove(id: number) {
    const config = await GlobalConfig.findByPk(id);
    if (!config) {
      throw new BusinessError(400, '配置不存在');
    }

    if (config.isActive === 1) {
      throw new BusinessError(400, '不能删除当前启用的配置');
    }

    await config.destroy();

    // 清除缓存
    await redis.del(ACTIVE_CONFIG_CACHE_KEY);
    logger.info(`[GlobalConfig] 删除配置: ${config.name}`);
  }
}

export default new GlobalConfigService();
