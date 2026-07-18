import orderService from '../services/order.service';
import RefundRecord from '../models/RefundRecord';
import { OrderStatus } from '../constants/order';
import { withTransaction } from '../utils/transaction';
import logger from '../utils/logger';

interface PayCallbackData {
  outTradeNo: string;
  transactionId: string;
  totalFee: number;
  timeEnd?: string;
}

interface RefundCallbackData {
  outRefundNo: string;
  refundStatus: string;
}

/** 处理支付回调（事务保护） */
export async function processPayCallback(data: PayCallbackData) {
  await withTransaction(async (t) => {
    const { outTradeNo, transactionId, totalFee, timeEnd } = data;

    const order = await orderService.getByOrderNo(outTradeNo);
    if (!order) {
      logger.error(`[Callback] 支付回调: 订单不存在 outTradeNo=${outTradeNo}`);
      return;
    }

    if (order.status === OrderStatus.PAID) {
      logger.warn(`[Callback] 支付回调: 订单已支付 outTradeNo=${outTradeNo}`);
      return;
    }

    // 解析时间
    let payTime: Date | undefined;
    if (timeEnd) {
      payTime = new Date(
        parseInt(timeEnd.slice(0, 4)), parseInt(timeEnd.slice(4, 6)) - 1,
        parseInt(timeEnd.slice(6, 8)), parseInt(timeEnd.slice(8, 10)),
        parseInt(timeEnd.slice(10, 12)), parseInt(timeEnd.slice(12, 14)),
      );
    }

    await orderService.updateStatus(order.id, OrderStatus.PAID, { transactionId, payTime }, t);
    logger.info(`[Callback] 支付成功: ${order.orderNo}, transactionId=${transactionId}`);
  });
}

/** 处理退款回调（事务保护，记录在控制器中已创建） */
export async function processRefundCallback(data: RefundCallbackData) {
  await withTransaction(async (t) => {
    const { outRefundNo, refundStatus } = data;

    const record = await RefundRecord.findOne({ where: { refundNo: outRefundNo } });
    if (!record) {
      logger.error(`[Callback] 退款回调: 记录不存在 refundNo=${outRefundNo}`);
      return;
    }

    if (refundStatus === 'SUCCESS') {
      await record.update({ status: 'SUCCESS' }, { transaction: t });
      await orderService.refundSuccess(record.orderId, outRefundNo, t);
      logger.info(`[Callback] 退款成功: ${outRefundNo}`);
    } else {
      await record.update({ status: 'FAIL', errorMsg: `回调通知状态: ${refundStatus}` }, { transaction: t });
      await orderService.refundFail(record.orderId, outRefundNo, `回调通知状态: ${refundStatus}`);
      logger.warn(`[Callback] 退款异常: ${outRefundNo}, status=${refundStatus}`);
    }
  });
}
