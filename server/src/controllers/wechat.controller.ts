import { Request, Response } from 'express';
import wechatService from '../services/wechat.service';
import { success, fail } from '../utils/response';

/** 获取用户 OpenID */
export async function getOpenid(req: Request, res: Response): Promise<void> {
  const { code } = req.body;
  if (!code) {
    res.json(fail(400, 'code 不能为空'));
    return;
  }

  const result = await wechatService.getOpenid(code);
  res.json(success(result));
}

/** 获取用户手机号 */
export async function getPhone(req: Request, res: Response): Promise<void> {
  const { code } = req.body;
  if (!code) {
    res.json(fail(400, 'code 不能为空'));
    return;
  }

  const result = await wechatService.getPhone(code);
  res.json(success(result));
}

/** 发送订阅消息 */
export async function sendSubscribe(req: Request, res: Response): Promise<void> {
  const { openid, templateId, data, page } = req.body;
  if (!openid || !templateId || !data) {
    res.json(fail(400, 'openid、templateId 和 data 不能为空'));
    return;
  }

  const result = await wechatService.sendSubscribeMessage(
    openid,
    templateId,
    data,
    page,
  );
  res.json(success(result));
}

/** 统一下单 */
export async function unifiedOrder(req: Request, res: Response): Promise<void> {
  const { outTradeNo, body, totalFee, openid, notifyUrl } = req.body;
  if (!outTradeNo || !body || !totalFee || !openid) {
    res.json(fail(400, 'outTradeNo、body、totalFee 和 openid 不能为空'));
    return;
  }

  const result = await wechatService.unifiedOrder({
    outTradeNo,
    body,
    totalFee,
    openid,
    notifyUrl,
  });
  res.json(success(result));
}

/** 查询订单 */
export async function queryOrder(req: Request, res: Response): Promise<void> {
  const { outTradeNo, transactionId } = req.body;

  const result = await wechatService.queryOrder({
    outTradeNo,
    transactionId,
  });
  res.json(success(result));
}

/** 申请退款 */
export async function refund(req: Request, res: Response): Promise<void> {
  const { outTradeNo, outRefundNo, totalFee, refundFee, refundDesc } = req.body;
  if (!outTradeNo || !outRefundNo || refundFee === undefined) {
    res.json(
      fail(400, 'outTradeNo、outRefundNo 和 refundFee 不能为空'),
    );
    return;
  }

  const result = await wechatService.refund({
    outTradeNo,
    outRefundNo,
    totalFee,
    refundFee,
    refundDesc,
  });
  res.json(success(result));
}

/** 查询退款 */
export async function queryRefund(req: Request, res: Response): Promise<void> {
  const { outRefundNo } = req.body;
  if (!outRefundNo) {
    res.json(fail(400, 'outRefundNo 不能为空'));
    return;
  }

  const result = await wechatService.queryRefund(outRefundNo);
  res.json(success(result));
}
