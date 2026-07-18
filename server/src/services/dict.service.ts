import DictType from '../models/DictType';
import DictData from '../models/DictData';
import { BusinessError } from '../utils/response';
import { Op } from 'sequelize';
import { redis } from '../config/redis';

const DICT_CACHE_PREFIX = 'dict:';

class DictService {
  /** 获取字典类型列表 */
  async getTypes(params?: { keyword?: string; status?: number; page?: number; pageSize?: number }) {
    const where: any = {};
    if (params?.keyword) {
      where[Op.or] = [
        { name: { [Op.like]: `%${params.keyword}%` } },
        { code: { [Op.like]: `%${params.keyword}%` } },
      ];
    }
    if (params?.status !== undefined && params?.status !== null) {
      where.status = params.status;
    }

    const page = params?.page || 1;
    const pageSize = params?.pageSize || 10;

    const { rows, count } = await DictType.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });

    return { list: rows, total: count, page, pageSize };
  }

  /** 获取所有字典（类型 + 数据，用于前端初始化） */
  async getAll() {
    const types = await DictType.findAll({ where: { status: 1 } });
    const result: any[] = [];

    for (const type of types) {
      const dataList = await DictData.findAll({
        where: { typeId: type.id, status: 1 },
        order: [['sort', 'ASC']],
      });
      result.push({
        id: type.id,
        code: type.code,
        name: type.name,
        items: dataList.map(d => ({
          label: d.label,
          value: d.value,
          remark: d.remark,
        })),
      });
    }

    return result;
  }

  /** 创建字典类型 */
  async createType(data: { name: string; code: string; status?: number }) {
    const exist = await DictType.findOne({ where: { code: data.code } });
    if (exist) {
      throw new BusinessError(400, '字典编码已存在');
    }

    const type = await DictType.create({
      name: data.name,
      code: data.code,
      status: data.status ?? 1,
    });

    return type;
  }

  /** 更新字典类型 */
  async updateType(id: number, data: { name?: string; code?: string; status?: number }) {
    const type = await DictType.findByPk(id);
    if (!type) {
      throw new BusinessError(400, '字典类型不存在');
    }

    await type.update(data);

    // 更新Redis缓存
    await this.syncCache(type.code);

    return type;
  }

  /** 删除字典类型 */
  async deleteType(id: number) {
    const type = await DictType.findByPk(id);
    if (!type) {
      throw new BusinessError(400, '字典类型不存在');
    }

    // 删除关联的字典数据
    await DictData.destroy({ where: { typeId: id } });
    // 删除类型
    const code = type.code;
    await type.destroy();

    // 清除Redis缓存
    await redis.del(DICT_CACHE_PREFIX + code);
  }

  /** 根据类型编码获取字典数据 */
  async getDataByCode(typeCode: string) {
    // 先查Redis缓存
    const cacheKey = DICT_CACHE_PREFIX + typeCode;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // 查数据库
    const type = await DictType.findOne({ where: { code: typeCode } });
    if (!type) {
      throw new BusinessError(400, '字典类型不存在');
    }

    const dataList = await DictData.findAll({
      where: { typeId: type.id, status: 1 },
      order: [['sort', 'ASC']],
    });

    const result = dataList.map(d => ({
      id: d.id,
      label: d.label,
      value: d.value,
      sort: d.sort,
      remark: d.remark,
    }));

    // 缓存到Redis（1小时）
    await redis.setex(cacheKey, 3600, JSON.stringify(result));

    return result;
  }

  /** 获取字典数据分页列表 */
  async getDataList(params: { dictTypeId: number; page?: number; pageSize?: number; keyword?: string }) {
    const where: any = { typeId: params.dictTypeId, status: 1 };
    if (params.keyword) {
      where[Op.or] = [
        { label: { [Op.like]: `%${params.keyword}%` } },
        { value: { [Op.like]: `%${params.keyword}%` } },
      ];
    }

    const page = params.page || 1;
    const pageSize = params.pageSize || 10;

    const { rows, count } = await DictData.findAndCountAll({
      where,
      order: [['sort', 'ASC']],
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });

    return {
      list: rows,
      total: count,
      page,
      pageSize,
    };
  }

  /** 创建字典数据 */
  async createData(data: {
    typeId: number;
    label: string;
    value: string;
    sort?: number;
    status?: number;
  }) {
    const dictData = await DictData.create({
      typeId: data.typeId,
      label: data.label,
      value: data.value,
      sort: data.sort ?? 0,
      status: data.status ?? 1,
    });

    // 更新Redis缓存
    const type = await DictType.findByPk(data.typeId);
    if (type) {
      await this.syncCache(type.code);
    }

    return dictData;
  }

  /** 更新字典数据 */
  async updateData(id: number, data: {
    label?: string;
    value?: string;
    sort?: number;
    status?: number;
  }) {
    const dictData = await DictData.findByPk(id);
    if (!dictData) {
      throw new BusinessError(400, '字典数据不存在');
    }

    await dictData.update(data);

    // 更新Redis缓存
    const type = await DictType.findByPk(dictData.typeId);
    if (type) {
      await this.syncCache(type.code);
    }

    return dictData;
  }

  /** 删除字典数据 */
  async deleteData(id: number) {
    const dictData = await DictData.findByPk(id);
    if (!dictData) {
      throw new BusinessError(400, '字典数据不存在');
    }

    const type = await DictType.findByPk(dictData.typeId);
    await dictData.destroy();

    // 更新Redis缓存
    if (type) {
      await this.syncCache(type.code);
    }
  }

  /** 同步缓存：重新加载字典数据并写入Redis */
  private async syncCache(typeCode: string) {
    const type = await DictType.findOne({ where: { code: typeCode } });
    if (!type) {
      await redis.del(DICT_CACHE_PREFIX + typeCode);
      return;
    }

    const dataList = await DictData.findAll({
      where: { typeId: type.id, status: 1 },
      order: [['sort', 'ASC']],
    });

    const result = dataList.map(d => ({
      id: d.id,
      label: d.label,
      value: d.value,
      sort: d.sort,
    }));

    await redis.setex(DICT_CACHE_PREFIX + typeCode, 3600, JSON.stringify(result));
  }
}

export default new DictService();
