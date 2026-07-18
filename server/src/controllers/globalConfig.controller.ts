import { Request, Response } from "express";
import globalConfigService from "../services/globalConfig.service";
import { success, fail } from "../utils/response";

/** 获取配置列表 */
export async function getList(req: Request, res: Response): Promise<void> {
  const list = await globalConfigService.getList();
  res.json(success(list));
}

/** 获取当前启用的配置 */
export async function getActive(req: Request, res: Response): Promise<void> {
  const result = await globalConfigService.getActive();
  res.json(success(result));
}

/** 设置指定配置为启用 */
export async function setActive(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.json(fail(400, "ID格式不正确"));
    return;
  }
  const config = await globalConfigService.setActive(id);
  res.json(success(config, "设置成功"));
}

/** 创建配置 */
export async function create(req: Request, res: Response): Promise<void> {
  const { name, isActive, wechatConfig, ossConfig, remark } = req.body;

  if (!name) {
    res.json(fail(400, "配置名称不能为空"));
    return;
  }

  const config = await globalConfigService.create({
    name,
    isActive,
    wechatConfig,
    ossConfig,
    remark,
  });

  res.json(success(config, "创建成功"));
}

/** 更新配置 */
export async function update(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.json(fail(400, "ID格式不正确"));
    return;
  }

  const { name, isActive, wechatConfig, ossConfig, remark } = req.body;

  const config = await globalConfigService.update(id, {
    name,
    isActive,
    wechatConfig,
    ossConfig,
    remark,
  });

  res.json(success(config, "更新成功"));
}

/** 删除配置 */
export async function remove(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.json(fail(400, "ID格式不正确"));
    return;
  }

  await globalConfigService.remove(id);
  res.json(success(null, "删除成功"));
}
