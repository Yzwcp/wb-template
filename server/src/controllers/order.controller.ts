import { Request, Response } from "express";
import { generateOrderNo, generateRefundNo } from "../utils/orderNo";
import { OrderStatus, WECHAT_TRADE_STATE_MAP } from "../constants/order";
import RefundRecord from "../models/RefundRecord";
import orderService from "../services/order.service";
import productService from "../services/product.service";
import wechatService from "../services/wechat.service";
import { success, fail, page } from "../utils/response";
import logger from "../utils/logger";

/** 获取订单列表 */
export async function getList(req: Request, res: Response): Promise<void> {
  const pageNum = parseInt(req.query.page as string) || 1;
  const pageSizeNum = parseInt(req.query.pageSize as string) || 10;
  const { orderNo, status, userId, startDate, endDate } = req.query;

  const result = await orderService.getList({
    page: pageNum,
    pageSize: pageSizeNum,
    orderNo: orderNo as string,
    status: status as string,
    userId: userId ? parseInt(userId as string) : undefined,
    startDate: startDate as string,
    endDate: endDate as string,
  });

  res.json(page(result.list, result.total, result.page, result.pageSize));
}

/** 根据 ID 获取订单 */
export async function getById(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.json(fail(400, "ID格式不正确"));
    return;
  }

  const order = await orderService.getById(id);
  res.json(success(order));
}

/** 创建订单 */
export async function create(req: Request, res: Response): Promise<void> {
  const {
    orderNo,
    outTradeNo,
    totalFee,
    body,
    openid,
    userId,
    wechatConfigId,
  } = req.body;

  if (!orderNo || !outTradeNo || !totalFee || !body) {
    res.json(fail(400, "orderNo、outTradeNo、totalFee 和 body 不能为空"));
    return;
  }

  const order = await orderService.create({
    orderNo,
    outTradeNo,
    totalFee,
    body,
    openid,
    userId,
    wechatConfigId,
  });

  res.json(success(order, "创建成功"));
}

/** 支付回调（公开接口，无需认证） */
export async function payCallback(req: Request, res: Response): Promise<void> {
  const { outTradeNo, transactionId, totalFee, timeEnd } = req.body;

  if (!outTradeNo || !transactionId) {
    res.json(fail(400, "outTradeNo 和 transactionId 不能为空"));
    return;
  }

  const order = await orderService.payCallback({
    outTradeNo,
    transactionId,
    totalFee: totalFee ? parseInt(totalFee) : 0,
    timeEnd,
  });

  // 审计日志
  logger.info(
    `[Order] 支付回调审计: orderNo=${order.orderNo}, ` +
      `transactionId=${transactionId}, amount=${totalFee || 0}, time=${timeEnd}`,
  );

  res.json(success(order, "回调处理成功"));
}

/** 申请退款 */
export async function refund(req: Request, res: Response): Promise<void> {
  const { id, refundFee, refundDesc } = req.body;

  if (!id || !refundFee) {
    res.json(fail(400, "订单ID和退款金额不能为空"));
    return;
  }

  const orderId = parseInt(id);
  const fee = parseInt(refundFee);
  if (isNaN(orderId) || isNaN(fee)) {
    res.json(fail(400, "订单ID或退款金额格式不正确"));
    return;
  }

  const outRefundNo = generateRefundNo();

  // 事务: 创建退款记录 + 更新订单为退款中
  const { order } = await orderService.processRefundWithRecord(
    orderId,
    fee,
    outRefundNo,
    refundDesc,
    req.user?.username,
  );

  try {
    await wechatService.refund({
      outTradeNo: order.outTradeNo,
      outRefundNo,
      totalFee: order.totalFee,
      refundFee: fee,
      refundDesc,
    });
    // await orderService.refundSuccess(orderId, outRefundNo);
    res.json(success({ order, refundNo: outRefundNo }, "退款申请已提交"));
  } catch (err: any) {
    logger.error(`[Order] 退款失败: ${err.message}`);
    await orderService.refundFail(orderId, outRefundNo, err.message);
    res.json(fail(500, `退款失败: ${err.message}`));
  }
}

/** 退款回调（微信异步通知） */
export async function refundCallback(
  req: Request,
  res: Response,
): Promise<void> {
  const { outRefundNo, status } = req.body;

  const record = await RefundRecord.findOne({
    where: { refundNo: outRefundNo },
  });
  if (!record) {
    res.json(fail(400, "退款记录不存在"));
    return;
  }

  if (status === "SUCCESS") {
    await orderService.refundSuccess(record.orderId, outRefundNo);
  } else {
    await orderService.refundFail(
      record.orderId,
      outRefundNo,
      `回调通知状态: ${status}`,
    );
  }
  res.json(success(null, "回调处理成功"));
}

/** 同步退款状态（手动查询微信） */
export async function syncRefund(req: Request, res: Response): Promise<void> {
  const { id } = req.body;
  if (!id) {
    res.json(fail(400, "订单ID不能为空"));
    return;
  }

  const orderId = parseInt(id);
  const records = await RefundRecord.findAll({
    where: { orderId, status: "PROCESSING" },
    order: [["createdAt", "DESC"]],
  });

  if (records.length === 0) {
    res.json(fail(400, "没有处理中的退款记录"));
    return;
  }

  const results: any[] = [];
  for (const record of records) {
    try {
      const wxResult = await wechatService.queryRefund(record.refundNo);
      if (wxResult.refund_status_0 === "SUCCESS") {
        await orderService.refundSuccess(orderId, record.refundNo);
        results.push({ refundNo: record.refundNo, status: "SUCCESS" });
      }
    } catch (err: any) {
      if (
        err.message?.includes("ORDERNOTEXIST") ||
        err.message?.includes("REFUNDNOTEXIST")
      ) {
        await orderService.refundFail(orderId, record.refundNo, err.message);
      }
      results.push({
        refundNo: record.refundNo,
        status: "ERROR",
        error: err.message,
      });
    }
  }
  res.json(success(results, "同步完成"));
}

/** 查询微信订单并同步 */
export async function queryAndSync(req: Request, res: Response): Promise<void> {
  const { outTradeNo } = req.body;

  if (!outTradeNo) {
    res.json(fail(400, "outTradeNo 不能为空"));
    return;
  }

  // 查询微信订单
  let wechatOrder: any;
  try {
    wechatOrder = await wechatService.queryOrder({ outTradeNo });
  } catch (err: any) {
    if (err.message?.includes("ORDERNOTEXIST")) {
      res.json(fail(400, "微信侧无此订单（该订单未通过微信支付或已过期）"));
    } else {
      res.json(fail(500, `查询微信订单失败: ${err.message}`));
    }
    return;
  }

  // 查找本地订单
  const order = await orderService.getByOrderNo(outTradeNo);
  if (!order) {
    res.json(fail(400, "本地订单不存在"));
    return;
  }

  // 同步状态
  const newStatus =
    WECHAT_TRADE_STATE_MAP[wechatOrder.trade_state] || order.status;

  if (newStatus !== order.status) {
    // 解析微信时间格式 "YYYYMMDDHHMMSS" → Date
    let payTime: Date | undefined;
    if (wechatOrder.time_end) {
      const t = wechatOrder.time_end;
      payTime = new Date(
        parseInt(t.slice(0, 4)),
        parseInt(t.slice(4, 6)) - 1,
        parseInt(t.slice(6, 8)),
        parseInt(t.slice(8, 10)),
        parseInt(t.slice(10, 12)),
        parseInt(t.slice(12, 14)),
      );
    }

    await orderService.updateStatus(order.id, newStatus, {
      transactionId: wechatOrder.transaction_id,
      payTime,
    });
  }

  const updatedOrder = await orderService.getById(order.id);
  res.json(success({ order: updatedOrder, wechatOrder }, "同步成功"));
}

/** 获取订单退款记录 */
export async function getRefundRecords(
  req: Request,
  res: Response,
): Promise<void> {
  const orderId = parseInt(req.params.id);
  if (isNaN(orderId)) {
    res.json(fail(400, "订单ID格式不正确"));
    return;
  }
  const records = await RefundRecord.findAll({
    where: { orderId },
    order: [["createdAt", "DESC"]],
  });
  res.json(success(records));
}

// ==================== 小程序专用接口 ====================

/** 小程序创建订单 */
export async function mpCreate(req: Request, res: Response): Promise<void> {
  const userId = req.user?.userId;
  if (!userId) {
    res.json(fail(401, "未登录"));
    return;
  }

  const { productId, quantity = 1, remark } = req.body;
  if (!productId) {
    res.json(fail(400, "productId 不能为空"));
    return;
  }

  const prod = await productService.getById(productId);
  if (!prod || prod.status !== 1) {
    res.json(fail(400, "商品不存在或已下架"));
    return;
  }

  const orderNo = generateOrderNo();
  const outTradeNo = orderNo;
  const totalFee = prod.price * quantity;

  const order = await orderService.create({
    orderNo,
    outTradeNo,
    totalFee,
    body: `${prod.name} x${quantity}${remark ? ` (${remark})` : ""}`,
    userId,
    productId,
  });

  res.json(success(order, "创建成功"));
}

/** 小程序发起支付 */
export async function mpPay(req: Request, res: Response): Promise<void> {
  const userId = req.user?.userId;
  if (!userId) {
    res.json(fail(401, "未登录"));
    return;
  }

  const { orderId, code } = req.body;
  if (!orderId || !code) {
    res.json(fail(400, "orderId 和 code 不能为空"));
    return;
  }

  const order = await orderService.getById(orderId);
  if (order.userId !== userId) {
    res.json(fail(403, "无权操作此订单"));
    return;
  }

  // 获取 openid
  const { openid } = await wechatService.getOpenid(code);

  // 统一下单
  const { payParams, prepay_id } = await wechatService.unifiedOrder({
    outTradeNo: order.outTradeNo,
    body: order.body,
    totalFee: order.totalFee,
    openid,
  });

  // 保存 prepay_id
  await orderService.updateStatus(order.id, order.status, {
    prepayId: prepay_id,
  });

  res.json(success({ payParams }));
}

/** 小程序订单列表 */
export async function mpList(req: Request, res: Response): Promise<void> {
  const userId = req.user?.userId;
  if (!userId) {
    res.json(fail(401, "未登录"));
    return;
  }

  const pageNum = parseInt(req.query.page as string) || 1;
  const pageSizeNum = parseInt(req.query.pageSize as string) || 10;

  const result = await orderService.getList({
    page: pageNum,
    pageSize: pageSizeNum,
    userId,
  });
  res.json(page(result.list, result.total, result.page, result.pageSize));
}
