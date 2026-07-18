import User from "../models/User";
import Role from "../models/Role";
import UserRole from "../models/UserRole";
import { hashPassword } from "../utils/password";
import { BusinessError } from "../utils/response";
import { Op } from "sequelize";
import { redis } from "../config/redis";

interface UserListParams {
  page: number;
  pageSize: number;
  keyword?: string;
  status?: number;
}

class UserService {
  /** 获取用户列表（分页） */
  async getList(params: UserListParams) {
    const { page, pageSize, keyword, status } = params;

    const where: any = {};
    if (keyword) {
      where[Op.or] = [
        { username: { [Op.like]: `%${keyword}%` } },
        { nickname: { [Op.like]: `%${keyword}%` } },
        { email: { [Op.like]: `%${keyword}%` } },
      ];
    }
    if (status !== undefined && status !== null) {
      where.status = status;
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      include: [
        {
          model: Role,
          attributes: ["id", "name", "code"],
          through: { attributes: [] },
        },
      ],
      attributes: { exclude: ["password"] },
      order: [["created_at", "DESC"]],
      offset: (page - 1) * pageSize,
      limit: pageSize,
    });

    return { list: rows, total: count, page, pageSize };
  }

  /** 根据ID获取用户 */
  async getById(id: number) {
    const user = await User.findByPk(id, {
      attributes: { exclude: ["password"] },
      include: [
        {
          model: Role,
          attributes: ["id", "name", "code"],
          through: { attributes: [] },
        },
      ],
    });
    if (!user) {
      throw new BusinessError(400, "用户不存在");
    }
    return user;
  }

  /** 创建用户 */
  async create(data: {
    username: string;
    password: string;
    nickname?: string;
    email?: string;
    phone?: string;
    avatar?: string;
    status?: number;
    platform?: string;
  }) {
    // 检查用户名是否已存在
    const exist = await User.findOne({ where: { username: data.username } });
    if (exist) {
      throw new BusinessError(400, "用户已存在");
    }

    const hashedPw = await hashPassword(data.password);
    const user = await User.create({
      ...data,
      password: hashedPw,
      status: data.status ?? 1,
    });

    return user;
  }

  /** 更新用户 */
  async update(
    id: number,
    data: {
      nickname?: string;
      email?: string;
      phone?: string;
      avatar?: string;
      status?: number;
    },
  ) {
    const user = await User.findByPk(id);
    if (!user) {
      throw new BusinessError(400, "用户不存在");
    }

    // 不允许修改用户名
    await user.update(data);

    // 清除权限缓存
    await redis.del(`user:perm:${id}`);

    return user;
  }

  /** 删除用户 */
  async remove(id: number) {
    const user = await User.findByPk(id);
    if (!user) {
      throw new BusinessError(400, "用户不存在");
    }

    // 删除用户角色关联
    await UserRole.destroy({ where: { userId: id } });
    // 删除用户
    await user.destroy();
    // 清除缓存
    await redis.del(`user:perm:${id}`);
    await redis.del(`refresh_token:${id}`);
  }

  /** 更新用户状态 */
  async updateStatus(id: number, status: string) {
    const user = await User.findByPk(id);
    if (!user) {
      throw new BusinessError(400, "用户不存在");
    }

    await user.update({ status });

    if (status === "2") {
      // 禁用时清除 token 和缓存
      await redis.del(`user:perm:${id}`);
      await redis.del(`refresh_token:${id}`);
    }

    return user;
  }

  /** 分配角色 */
  async assignRoles(userId: number, roleIds: number[]) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new BusinessError(400, "用户不存在");
    }

    // 使用事务
    const { sequelize } = require("../config/database");
    await sequelize.transaction(async (t: any) => {
      // 删除原有角色关联
      await UserRole.destroy({ where: { userId }, transaction: t });
      // 批量创建新角色关联
      if (roleIds && roleIds.length > 0) {
        const records = roleIds.map((roleId) => ({ userId, roleId }));
        await UserRole.bulkCreate(records, { transaction: t });
      }
    });

    // 清除权限缓存
    await redis.del(`user:perm:${userId}`);

    return { userId, roleIds };
  }
}

export default new UserService();
