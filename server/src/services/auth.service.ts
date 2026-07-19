import User from "../models/User";
import Role from "../models/Role";
import Menu from "../models/Menu";
import Permission from "../models/Permission";
import LoginLog from "../models/LoginLog";
import { comparePassword } from "../utils/password";
import { signAccessToken, signRefreshToken, verifyToken } from "../utils/jwt";
import { redis } from "../cache";
import { config } from "../config/index";
import { BusinessError } from "../utils/response";
import wechatService from "./wechat.service";

interface LoginResult {
  token: string;
  refreshToken: string;
  userInfo: {
    id: number;
    username: string;
    nickname: string;
    avatar: string;
  };
}

interface MenuTreeNode {
  id: number;
  parentId: number;
  name: string;
  type: string;
  path: string;
  component: string;
  icon: string;
  permission: string;
  sort: number;
  visible: number;
  status: number;
  children: MenuTreeNode[];
}

class AuthService {
  /** 用户登录 */
  async login(
    username: string,
    password: string,
    ip: string = "",
    userAgent: string = "",
  ): Promise<LoginResult> {
    // 查找用户
    const user = await User.findOne({ where: { username } });
    if (!user) {
      // 记录登录失败日志
      await LoginLog.create({
        username,
        ip,
        userAgent,
        status: "2",
        message: "用户不存在",
      });
      throw new BusinessError(400, "用户名或密码错误");
    }

    // 检查用户状态
    if (user.status === "2") {
      await LoginLog.create({
        username,
        ip,
        userAgent,
        status: "2",
        message: "用户已被禁用",
      });
      throw new BusinessError(400, "用户已被禁用，请联系管理员");
    }

    // 验证密码
    const isValid = await comparePassword(password, user.password);
    if (!isValid) {
      await LoginLog.create({
        username,
        ip,
        userAgent,
        status: "2",
        message: "密码错误",
      });
      throw new BusinessError(400, "用户名或密码错误");
    }

    // 生成 Token
    const payload = {
      userId: user.id,
      username: user.username,
      platform: user.platform,
    };
    const token = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    // 存储 refreshToken 到 Redis（7天过期）
    await redis.setex(
      `refresh_token:${user.id}`,
      7 * 24 * 60 * 60,
      refreshToken,
    );

    // 清除缓存的权限（下次请求时重新加载）
    await redis.del(`user:perm:${user.id}`);

    // 更新最后登录时间和IP
    user.lastLoginAt = new Date();
    user.lastLoginIp = ip;
    await user.save();

    // 记录登录成功日志
    await LoginLog.create({
      username,
      ip,
      userAgent,
      status: 1,
      message: "登录成功",
    });

    return {
      token,
      refreshToken,
      userInfo: {
        id: user.id,
        username: user.username,
        nickname: user.nickname || user.username,
        avatar: user.avatar || "",
      },
    };
  }

  /** 小程序登录（wx.login code → openid → 查找或创建用户 → 返回 JWT） */
  async mpLogin(
    code: string,
    ip: string = "",
    userAgent: string = "",
  ): Promise<LoginResult> {
    // 1. 通过 wx.login code 换取 openid
    const { openid } = await wechatService.getOpenid(code);

    // 2. 查找或创建用户
    let user = await User.findOne({ where: { openid: openid } });
    if (!user) {
      user = await User.create({
        username: openid,
        openid,
        nickname: `微信用户${openid.slice(-4)}`,
        password: "",
        status: 1,
        platform: "mp-weixin",
      });
    }

    if (user.status === "2") {
      throw new BusinessError(400, "用户已被禁用");
    }

    // 3. 生成 Token
    const payload = {
      userId: user.id,
      username: user.username,
      platform: user.platform,
    };
    const token = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    await redis.setex(
      `refresh_token:${user.id}`,
      7 * 24 * 60 * 60,
      refreshToken,
    );
    await redis.del(`user:perm:${user.id}`);

    user.lastLoginAt = new Date();
    user.lastLoginIp = ip;
    await user.save();

    return {
      token,
      refreshToken,
      userInfo: {
        id: user.id,
        username: user.username,
        nickname: user.nickname || user.username,
        avatar: user.avatar || "",
      },
    };
  }

  /** 刷新Token */
  async refreshToken(
    userId: number,
    refreshTokenStr: string,
  ): Promise<{ token: string; refreshToken: string }> {
    // 验证 Redis 中的 refreshToken
    const stored = await redis.get(`refresh_token:${userId}`);
    if (!stored || stored !== refreshTokenStr) {
      throw new BusinessError(401, "refreshToken无效或已过期");
    }

    // 验证 JWT
    try {
      verifyToken(refreshTokenStr);
    } catch {
      await redis.del(`refresh_token:${userId}`);
      throw new BusinessError(401, "refreshToken已过期");
    }

    // 查找用户
    const user = await User.findByPk(userId);
    if (!user || user.status === "2") {
      await redis.del(`refresh_token:${userId}`);
      throw new BusinessError(401, "用户已被禁用");
    }

    // 生成新的 Token
    const payload = {
      userId: user.id,
      username: user.username,
      platform: user.platform,
    };
    const token = signAccessToken(payload);
    const newRefreshToken = signRefreshToken(payload);

    // 更新 Redis
    await redis.setex(
      `refresh_token:${user.id}`,
      7 * 24 * 60 * 60,
      newRefreshToken,
    );

    return { token, refreshToken: newRefreshToken };
  }

  /** 用户登出 */
  async logout(userId: number): Promise<void> {
    // 删除 Redis 中的 refreshToken 和权限缓存
    await redis.del(`refresh_token:${userId}`);
    await redis.del(`user:perm:${userId}`);
  }

  /** 获取用户信息（含菜单树和权限列表） */
  async getUserInfo(userId: number): Promise<{
    id: number;
    username: string;
    nickname: string;
    avatar: string;
    email: string;
    phone: string;
    roles: string[];
    permissions: string[];
    menus: MenuTreeNode[];
  }> {
    const user = await User.findByPk(userId, {
      include: [
        {
          model: Role,
          include: [{ model: Menu }, { model: Permission }],
        },
      ],
    });

    if (!user) {
      throw new BusinessError(400, "用户不存在");
    }

    const roleList: Role[] = user.roles || [];
    const roleCodes: string[] = roleList.map((r) => r.code);

    // 收集所有菜单（去重）
    const menuMap = new Map<number, Menu>();
    const allMenuPermissions: string[] = [];

    // 收集所有直接权限
    const directPermissions: string[] = [];

    roleList.forEach((role) => {
      // 菜单
      (role.menus || []).forEach((menu) => {
        if (!menuMap.has(menu.id)) {
          menuMap.set(menu.id, menu);
          if (menu.permission) {
            allMenuPermissions.push(menu.permission);
          }
        }
      });
      // 直接权限
      (role.permissions || []).forEach((perm) => {
        if (!directPermissions.includes(perm.code)) {
          directPermissions.push(perm.code);
        }
      });
    });

    // 合并权限列表
    const permissions = Array.from(
      new Set([...allMenuPermissions, ...directPermissions]),
    );

    // 构建菜单树
    const allMenus = Array.from(menuMap.values());
    const menus = this.buildMenuTree(allMenus);

    return {
      id: user.id,
      username: user.username,
      nickname: user.nickname || user.username,
      avatar: user.avatar || "",
      email: user.email || "",
      phone: user.phone || "",
      roles: roleCodes,
      permissions,
      menus,
    };
  }

  /** 修改密码 */
  async changePassword(
    userId: number,
    oldPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new BusinessError(400, "用户不存在");
    }

    const isValid = await comparePassword(oldPassword, user.password);
    if (!isValid) {
      throw new BusinessError(400, "原密码错误");
    }

    const { hashPassword } = require("../utils/password");
    user.password = await hashPassword(newPassword);
    await user.save();

    // 清除 token，强制重新登录
    await redis.del(`refresh_token:${userId}`);
    await redis.del(`user:perm:${userId}`);
  }

  /** 构建菜单树 */
  private buildMenuTree(menus: Menu[]): MenuTreeNode[] {
    // 筛选启用的菜单
    const enabled = menus.filter((m) => m.status === 1);
    // 排序
    enabled.sort((a, b) => a.sort - b.sort);

    // 构建树
    const buildChildren = (parentId: number): MenuTreeNode[] => {
      return enabled
        .filter((m) => m.parentId === parentId)
        .map((m) => ({
          id: m.id,
          parentId: m.parentId,
          name: m.name,
          type: m.type,
          path: m.path || "",
          component: m.component || "",
          icon: m.icon || "",
          permission: m.permission || "",
          sort: m.sort,
          visible: m.visible,
          status: m.status,
          children: buildChildren(m.id),
        }));
    };

    return buildChildren(0);
  }
}

export default new AuthService();
