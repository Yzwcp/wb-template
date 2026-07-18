import { Request, Response } from 'express';
import authService from '../services/auth.service';
import { success, fail } from '../utils/response';
import { verifyToken } from '../utils/jwt';
import logger from '../utils/logger';

/** 用户登录 */
export async function login(req: Request, res: Response): Promise<void> {
  const { username, password } = req.body;
  if (!username || !password) {
    res.json(fail(400, '用户名和密码不能为空'));
    return;
  }

  const ip = (req.headers['x-forwarded-for'] as string) || req.ip || '';
  const userAgent = (req.headers['user-agent'] as string) || '';

  const result = await authService.login(username, password, ip, userAgent);

  res.json(success(result, '登录成功'));
}

/** 小程序登录 */
export async function mpLogin(req: Request, res: Response): Promise<void> {
  const { code } = req.body;
  if (!code) {
    res.json(fail(400, 'code 不能为空'));
    return;
  }

  const ip = (req.headers['x-forwarded-for'] as string) || req.ip || '';
  const userAgent = (req.headers['user-agent'] as string) || '';

  const result = await authService.mpLogin(code, ip, userAgent);
  res.json(success(result, '登录成功'));
}

/** 刷新 Token */
export async function refresh(req: Request, res: Response): Promise<void> {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    res.json(fail(400, 'refreshToken不能为空'));
    return;
  }

  // 从 refreshToken JWT 中直接解析 userId，无需 auth 中间件
  let userId: number;
  try {
    const payload = verifyToken(refreshToken);
    userId = payload.userId;
  } catch {
    res.json(fail(401, 'refreshToken无效或已过期'));
    return;
  }

  const result = await authService.refreshToken(userId, refreshToken);
  res.json(success(result, '刷新成功'));
}

/** 用户登出 */
export async function logout(req: Request, res: Response): Promise<void> {
  const userId = req.user?.userId;
  if (userId) {
    await authService.logout(userId);
  }
  res.json(success(null, '退出成功'));
}

/** 获取当前用户信息 */
export async function getUserInfo(req: Request, res: Response): Promise<void> {
  const userId = req.user?.userId;
  if (!userId) {
    res.json(fail(401, '未登录'));
    return;
  }

  const userInfo = await authService.getUserInfo(userId);
  res.json(success(userInfo, '获取成功'));
}

/** 修改密码 */
export async function changePassword(req: Request, res: Response): Promise<void> {
  const userId = req.user?.userId;
  if (!userId) {
    res.json(fail(401, '未登录'));
    return;
  }

  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    res.json(fail(400, '原密码和新密码不能为空'));
    return;
  }

  await authService.changePassword(userId, oldPassword, newPassword);
  res.json(success(null, '密码修改成功'));
}

/** 获取验证码 */
export async function getCaptcha(_req: Request, res: Response): Promise<void> {
  // 验证码通常使用 svg-captcha 库生成，这里返回一个占位实现
  // 实际项目中需要安装 svg-captcha 并生成真实验证码
  res.json(success(
    { captchaId: Date.now().toString(), image: '' },
    '验证码获取成功（待实现）',
  ));
}

