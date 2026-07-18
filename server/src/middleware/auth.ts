import { Request, Response, NextFunction } from "express";
import { verifyToken, JwtPayload } from "../utils/jwt";
import User from "../models/User";
import { redis } from "../config/redis";

// 扩展 Express Request
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload & {
        permissions: string[];
        roles: string[];
      };
      requestId?: string;
      traceId?: string;
    }
  }
}

export async function auth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ code: 401, data: null, message: "未登录" });
      return;
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    // 检查 Redis 中是否有缓存的权限
    const cacheKey = `user:perm:${payload.userId}`;
    const cached = await redis.get(cacheKey);
    let permissions: string[] = [];
    let roles: string[] = [];

    if (cached) {
      const parsed = JSON.parse(cached);
      permissions = parsed.permissions || [];
      roles = parsed.roles || [];
    } else {
      // 从数据库加载并按角色缓存
      const user = await User.findByPk(payload.userId, {
        include: [
          {
            association: "roles",
            include: [{ association: "menus" }, { association: "permissions" }],
          },
        ],
      });

      if (!user || user.status === "2") {
        res
          .status(401)
          .json({ code: 401, data: null, message: "用户已被禁用" });
        return;
      }

      const roleList = user.roles || [];
      roles = roleList.map((r) => r.code);

      const menuPerms: string[] = [];
      const directPerms: string[] = [];
      roleList.forEach((role) => {
        (role.menus || []).forEach((m) => {
          if (m.permission) menuPerms.push(m.permission);
        });
        (role.permissions || []).forEach((p) => {
          directPerms.push(p.code);
        });
      });
      permissions = [...new Set([...menuPerms, ...directPerms])];

      // 缓存 30 分钟
      await redis.setex(cacheKey, 1800, JSON.stringify({ permissions, roles }));
    }

    req.user = { ...payload, permissions, roles };
    next();
  } catch (err: any) {
    if (err.name === "TokenExpiredError") {
      res.status(401).json({ code: 401, data: null, message: "登录已过期" });
      return;
    }
    res.status(401).json({ code: 401, data: null, message: "Token无效" });
  }
}

/**
 * 权限校验中间件工厂
 * @param requiredPermission 所需权限码，如 'sys:user:list'
 */
export function requirePermission(requiredPermission: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ code: 401, data: null, message: "未登录" });
      return;
    }

    const { permissions } = req.user;

    // 超级管理员或拥有全部权限
    if (
      permissions.includes("*:*:*") ||
      permissions.includes(requiredPermission)
    ) {
      next();
      return;
    }

    res.status(403).json({ code: 403, data: null, message: "无权限访问" });
  };
}

/**
 * 需要任意一个权限
 */
export function requireAnyPermission(...perms: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ code: 401, data: null, message: "未登录" });
      return;
    }

    const { permissions } = req.user;
    if (
      permissions.includes("*:*:*") ||
      perms.some((p) => permissions.includes(p))
    ) {
      next();
      return;
    }

    res.status(403).json({ code: 403, data: null, message: "无权限访问" });
  };
}
