import Permission from "../models/Permission";
import RolePermission from "../models/RolePermission";
import UserRole from "../models/UserRole";
import { BusinessError } from "../utils/response";
import { redis } from "../cache";

class PermissionService {
  /** 获取权限列表 */
  async getList(params?: { keyword?: string; page?: number; pageSize?: number }) {
    const where: any = {};
    const { Op } = require("sequelize");
    if (params?.keyword) {
      where[Op.or] = [
        { name: { [Op.like]: "%" + params.keyword + "%" } },
        { code: { [Op.like]: "%" + params.keyword + "%" } },
      ];
    }

    const page = params?.page || 1;
    const pageSize = params?.pageSize || 10;

    const { rows, count } = await Permission.findAndCountAll({
      where,
      order: [["created_at", "ASC"]],
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });

    return { list: rows, total: count, page, pageSize };
  }

  /** 创建权限 */
  async create(data: { name: string; code: string; description?: string }) {
    const exist = await Permission.findOne({ where: { code: data.code } });
    if (exist) {
      throw new BusinessError(400, "权限编码已存在");
    }

    const permission = await Permission.create({
      name: data.name,
      code: data.code,
      description: data.description || "",
    });

    return permission;
  }

  /** 更新权限 */
  async update(id: number, data: { name?: string; description?: string }) {
    const permission = await Permission.findByPk(id);
    if (!permission) {
      throw new BusinessError(400, "权限不存在");
    }

    await permission.update(data);

    // 清除拥有该权限的所有用户的缓存
    await this.clearPermissionUserCache(id);

    return permission;
  }

  /** 删除权限 */
  async remove(id: number) {
    const permission = await Permission.findByPk(id);
    if (!permission) {
      throw new BusinessError(400, "权限不存在");
    }

    // 先清除缓存，再删除关联和数据
    await this.clearPermissionUserCache(id);

    await RolePermission.destroy({ where: { permissionId: id } });
    await permission.destroy();
  }

  /**
   * 清除拥有指定权限的所有用户的 user:perm + user:info 缓存。
   * 查询链路：permissionId → roleIds → userIds → 删除缓存
   */
  private async clearPermissionUserCache(permissionId: number) {
    const rolePerms = await RolePermission.findAll({
      where: { permissionId },
      attributes: ["roleId"],
    });
    if (rolePerms.length === 0) return;

    const roleIds = rolePerms.map((rp) => rp.roleId);
    const userRoles = await UserRole.findAll({
      where: { roleId: roleIds },
      attributes: ["userId"],
    });
    if (userRoles.length === 0) return;

    const userIds = [...new Set(userRoles.map((ur) => ur.userId))];
    const promises: Promise<any>[] = [];
    for (const uid of userIds) {
      promises.push(redis.del("user:perm:" + uid));
      promises.push(redis.del("user:info:" + uid));
    }
    await Promise.all(promises);
  }
}

export default new PermissionService();
