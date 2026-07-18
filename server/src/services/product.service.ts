import Product from '../models/Product';
import { BusinessError } from '../utils/response';
import { Op } from 'sequelize';

class ProductService {
  async getList(params: { page?: number; pageSize?: number; keyword?: string; status?: number }) {
    const where: any = {};
    if (params?.keyword) {
      where.name = { [Op.like]: `%${params.keyword}%` };
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

  async getAll() {
    return await Product.findAll({ where: { status: 1 }, order: [['sort', 'ASC']] });
  }

  async getById(id: number) {
    const p = await Product.findByPk(id);
    if (!p) throw new BusinessError(400, '商品不存在');
    return p;
  }

  async create(data: { name: string; description?: string; price: number; coverImage?: string; images?: string; stock?: number; sort?: number; status?: number }) {
    if (!data.name) throw new BusinessError(400, '商品名称不能为空');
    return await Product.create({ ...data, status: data.status ?? 1, sort: data.sort ?? 0, stock: data.stock ?? 0, price: data.price ?? 0 });
  }

  async update(id: number, data: any) {
    const p = await Product.findByPk(id);
    if (!p) throw new BusinessError(400, '商品不存在');
    return await p.update(data);
  }

  async remove(id: number) {
    const p = await Product.findByPk(id);
    if (!p) throw new BusinessError(400, '商品不存在');
    await p.destroy();
  }
}

export default new ProductService();
