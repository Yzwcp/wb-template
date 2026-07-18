import Permission from '../models/Permission';
import RolePermission from '../models/RolePermission';
import { BusinessError } from '../utils/response';

class PermissionService {
  /** 获取权限列表 */
  async getList(params?: { keyword?: string; page?: number; pageSize?: number }) {
    const where: any = {};
    const { Op } = require('sequelize');
    if (params?.keyword) {
      where[Op.or] = [
        { name: { [Op.like]: `%${params.keyword}%` } },
        { code: { [Op.like]: `%${params.keyword}%` } },
      ];
    }

    const page = params?.page || 1;
    const pageSize = params?.pageSize || 10;

    const { rows, count } = await Permission.findAndCountAll({
      where,
      order: [['created_at', 'ASC']],
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });

    return { list: rows, total: count, page, pageSize };
  }

  /** 创建权限 */
  async create(data: { name: string; code: string; description?: string }) {
    const exist = await Permission.findOne({ where: { code: data.code } });
    if (exist) {
      throw new BusinessError(400, '权限编码已存在');
    }

    const permission = await Permission.create({
      name: data.name,
      code: data.code,
      description: data.description || '',
    });

    return permission;
  }

  /** 更新权限 */
  async update(id: number, data: { name?: string; description?: string }) {
    const permission = await Permission.findByPk(id);
    if (!permission) {
      throw new BusinessError(400, '权限不存在');
    }

    await permission.update(data);
    return permission;
  }

  /** 删除权限 */
  async remove(id: number) {
    const permission = await Permission.findByPk(id);
    if (!permission) {
      throw new BusinessError(400, '权限不存在');
    }

    // 删除角色权限关联
    await RolePermission.destroy({ where: { permissionId: id } });

    // 删除权限
    await permission.destroy();
  }
}

export default new PermissionService();
