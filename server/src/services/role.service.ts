import Role from '../models/Role';
import RoleMenu from '../models/RoleMenu';
import { BusinessError } from '../utils/response';
import { redis } from '../config/redis';

class RoleService {
  /** 获取角色列表（分页） */
  async getList(params?: { keyword?: string; status?: number; page?: number; pageSize?: number }) {
    const where: any = {};
    const { Op } = require('sequelize');
    if (params?.keyword) {
      where.name = { [Op.like]: `%${params.keyword}%` };
    }
    if (params?.status !== undefined && params?.status !== null) {
      where.status = params.status;
    }

    const page = params?.page || 1;
    const pageSize = params?.pageSize || 10;

    const { rows, count } = await Role.findAndCountAll({
      where,
      order: [['sort', 'ASC']],
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });

    return { list: rows, total: count, page, pageSize };
  }

  /** 获取全部角色（不分页） */
  async getAll() {
    const roles = await Role.findAll({
      where: { status: 1 },
      order: [['sort', 'ASC']],
      attributes: ['id', 'name', 'code'],
    });
    return roles;
  }

  /** 根据ID获取角色 */
  async getById(id: number) {
    const role = await Role.findByPk(id, {
      include: [
        { association: 'menus', attributes: ['id'], through: { attributes: [] } },
        { association: 'permissions', attributes: ['id', 'code'], through: { attributes: [] } },
      ],
    });
    if (!role) {
      throw new BusinessError(400, '角色不存在');
    }
    return role;
  }

  /** 创建角色 */
  async create(data: {
    name: string;
    code: string;
    description?: string;
    sort?: number;
    status?: number;
  }) {
    const exist = await Role.findOne({ where: { code: data.code } });
    if (exist) {
      throw new BusinessError(400, '角色编码已存在');
    }

    const role = await Role.create({
      ...data,
      sort: data.sort ?? 0,
      status: data.status ?? 1,
    });

    return role;
  }

  /** 更新角色 */
  async update(id: number, data: {
    name?: string;
    description?: string;
    sort?: number;
    status?: number;
  }) {
    const role = await Role.findByPk(id);
    if (!role) {
      throw new BusinessError(400, '角色不存在');
    }

    await role.update(data);

    // 清除所有使用该角色的用户权限缓存
    await this.clearRoleUserCache(id);

    return role;
  }

  /** 删除角色 */
  async remove(id: number) {
    const role = await Role.findByPk(id);
    if (!role) {
      throw new BusinessError(400, '角色不存在');
    }

    // 删除关联
    await RoleMenu.destroy({ where: { roleId: id } });
    const RolePermission = require('../models/RolePermission').default;
    await RolePermission.destroy({ where: { roleId: id } });

    // 删除角色
    await role.destroy();

    // 清除缓存
    await this.clearRoleUserCache(id);
  }

  /** 为角色分配菜单 */
  async assignMenus(roleId: number, menuIds: number[]) {
    const role = await Role.findByPk(roleId);
    if (!role) {
      throw new BusinessError(400, '角色不存在');
    }

    const { sequelize } = require('../config/database');
    await sequelize.transaction(async (t: any) => {
      // 删除原有角色菜单关联
      await RoleMenu.destroy({ where: { roleId }, transaction: t });
      // 批量创建新关联
      if (menuIds && menuIds.length > 0) {
        const records = menuIds.map(menuId => ({ roleId, menuId }));
        await RoleMenu.bulkCreate(records, { transaction: t });
      }
    });

    // 清除所有使用该角色的用户权限缓存
    await this.clearRoleUserCache(roleId);

    return { roleId, menuIds };
  }

  /** 清除角色的用户权限缓存 */
  private async clearRoleUserCache(roleId: number) {
    const UserRole = require('../models/UserRole').default;
    const userRoles = await UserRole.findAll({ where: { roleId } });
    const deletePromises = userRoles.map((ur: any) => redis.del(`user:perm:${ur.userId}`));
    await Promise.all(deletePromises);
  }
}

export default new RoleService();
