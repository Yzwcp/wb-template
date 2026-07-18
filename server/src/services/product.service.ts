import Product from '../models/Product';
import { BusinessError } from '../utils/response';
import { Op } from 'sequelize';
import { Cacheable, CacheEvict } from '../cache';

class ProductService {
  @Cacheable({ key: 'product:list', ttl: 300, list: true })
  async getList(params: { page?: number; pageSize?: number; keyword?: string; status?: number }) {
    const where: any = {};
    if (params?.keyword) {
      where.name = { [Op.like]: '%' + params.keyword + '%' };
    }
    if (params?.status !== undefined && params?.status !== null) {
      where.status = params.status;
    }
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 10;
    const { rows, count } = await Product.findAndCountAll({
      where, order: [['sort', 'ASC'], ['createdAt', 'DESC']],
      limit: pageSize, offset: (page - 1) * pageSize,
    });
    return { list: rows, total: count, page, pageSize };
  }

  @Cacheable({ key: 'product:all', ttl: 300 })
  async getAll() {
    return await Product.findAll({ where: { status: 1 }, order: [['sort', 'ASC']] });
  }

  @Cacheable({ key: (id: number) => 'product:' + id, ttl: 300 })
  async getById(id: number) {
    const p = await Product.findByPk(id);
    if (!p) throw new BusinessError(400, '商品不存在');
    return p;
  }

  @CacheEvict({ keys: ['product:all'], patterns: ['product:list:*'] })
  async create(data: { name: string; description?: string; price: number; coverImage?: string; images?: string; stock?: number; sort?: number; status?: number }) {
    if (!data.name) throw new BusinessError(400, '商品名称不能为空');
    return await Product.create({ ...data, status: data.status ?? 1, sort: data.sort ?? 0, stock: data.stock ?? 0, price: data.price ?? 0 });
  }

  @CacheEvict({ keys: [(id: number) => 'product:' + id, 'product:all'], patterns: ['product:list:*'] })
  async update(id: number, data: any) {
    const p = await Product.findByPk(id);
    if (!p) throw new BusinessError(400, '商品不存在');
    return await p.update(data);
  }

  @CacheEvict({ keys: [(id: number) => 'product:' + id, 'product:all'], patterns: ['product:list:*'] })
  async remove(id: number) {
    const p = await Product.findByPk(id);
    if (!p) throw new BusinessError(400, '商品不存在');
    await p.destroy();
  }
}

export default new ProductService();
