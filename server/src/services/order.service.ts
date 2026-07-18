import Order from "../models/Order";
import User from "../models/User";
import RefundRecord from "../models/RefundRecord";
import { BusinessError } from "../utils/response";
import logger from "../utils/logger";
import { Op } from "sequelize";
import { Transaction } from "sequelize";
import { OrderStatus, REFUNDABLE_STATUSES } from "../constants/order";
import dayjs from "dayjs";

class OrderService {
  async getList(params: {
    page?: number;
    pageSize?: number;
    orderNo?: string;
    status?: string;
    userId?: number;
    startDate?: string;
    endDate?: string;
  }) {
    const page = params.page || 1;
    const pageSize = params.pageSize || 10;
    const where: any = {};
    if (params.orderNo) where.orderNo = { [Op.like]: `%${params.orderNo}%` };
    if (params.status) where.status = params.status;
    if (params.userId) where.userId = params.userId;
    if (params.startDate || params.endDate) {
      where.createdAt = {};
      if (params.startDate) where.createdAt[Op.gte] = params.startDate;
      if (params.endDate)
        where.createdAt[Op.lte] = params.endDate + " 23:59:59";
    }
    const { rows, count } = await Order.findAndCountAll({
      where,
      order: [["createdAt", "DESC"]],
      limit: pageSize,
      offset: (page - 1) * pageSize,
      include: [User],
    });
    return { list: rows, total: count, page, pageSize };
  }

  async getById(id: number) {
    const order = await Order.findByPk(id);
    if (!order) throw new BusinessError(400, "订单不存在");
    return order;
  }

  async getByOrderNo(orderNo: string) {
    return await Order.findOne({ where: { orderNo } });
  }

  async create(data: {
    orderNo: string;
    outTradeNo: string;
    totalFee: number;
    body: string;
    openid?: string;
    userId?: number;
    productId?: number;
    wechatConfigId?: number;
  }) {
    const order = await Order.create({
      orderNo: data.orderNo,
      outTradeNo: data.outTradeNo,
      totalFee: data.totalFee,
      body: data.body,
      openid: data.openid,
      userId: data.userId,
      productId: data.productId,
      wechatConfigId: data.wechatConfigId,
      status: OrderStatus.PENDING,
    });
    logger.info(`[Order] 创建订单: ${order.orderNo}`);
    return order;
  }

  async updateStatus(
    id: number,
    status: string,
    extra?: {
      payTime?: Date;
      transactionId?: string;
      refundFee?: number;
      refundStatus?: string;
      refundNo?: string;
      prepayId?: string;
    },
    transaction?: Transaction,
  ) {
    const order = await Order.findByPk(id, { transaction });
    if (!order) throw new BusinessError(400, "订单不存在");
    const updateData: any = { status };
    if (extra) Object.assign(updateData, extra);
    await order.update(updateData, { transaction });
    logger.info(`[Order] 更新订单状态: ${order.orderNo} → ${status}`);
    return order;
  }

  async payCallback(
    data: {
      outTradeNo: string;
      transactionId: string;
      totalFee: number;
      timeEnd?: string;
    },
    transaction?: Transaction,
  ) {
    const order = await Order.findOne({
      where: { outTradeNo: data.outTradeNo },
      transaction,
    });
    if (!order) {
      logger.error(
        `[Order] 支付回调：订单不存在 outTradeNo=${data.outTradeNo}`,
      );
      throw new BusinessError(400, "订单不存在");
    }
    if (order.status === OrderStatus.PAID) {
      logger.warn(`[Order] 支付回调：订单已支付 outTradeNo=${data.outTradeNo}`);
      return order;
    }
    await order.update(
      {
        status: OrderStatus.PAID,
        transactionId: data.transactionId,
        payTime: data.timeEnd ? new Date(data.timeEnd) : new Date(),
      },
      { transaction },
    );
    logger.info(
      `[Order] 支付回调成功: ${order.orderNo}, transactionId=${data.transactionId}`,
    );
    return order;
  }

  async processRefundForWechat(
    orderId: number,
    refundFee: number,
    refundNo: string,
  ) {
    const { sequelize } = await import("../config/database");
    return sequelize.transaction(async (t) => {
      const order = await Order.findByPk(orderId, { transaction: t });
      if (!order) throw new BusinessError(400, "订单不存在");
      if (!REFUNDABLE_STATUSES.includes(order.status as any)) {
        throw new BusinessError(400, "当前订单状态不支持退款");
      }
      if (refundFee <= 0 || refundFee > order.totalFee - order.refundFee) {
        throw new BusinessError(400, "退款金额不合法");
      }
      await order.update(
        {
          status: OrderStatus.REFUNDING,
          refundStatus: "PROCESSING",
          refundFee: order.refundFee + refundFee,
          refundNo,
        },
        { transaction: t },
      );
      logger.info(`[Order] 退款发起: ${order.orderNo}, 金额: ${refundFee}分`);
      return order;
    });
  }

  /** 创建退款记录 + 更新订单（一个事务） */
  async processRefundWithRecord(
    orderId: number,
    refundFee: number,
    refundNo: string,
    refundDesc?: string,
    operator?: string,
  ) {
    const { sequelize } = await import("../config/database");
    return sequelize.transaction(async (t) => {
      const order = await Order.findByPk(orderId, { transaction: t });
      if (!order) throw new BusinessError(400, "订单不存在");
      if (!REFUNDABLE_STATUSES.includes(order.status as any)) {
        throw new BusinessError(400, "当前订单状态不支持退款");
      }
      if (refundFee <= 0 || refundFee > order.totalFee - order.refundFee) {
        throw new BusinessError(400, "退款金额不合法");
      }

      const record = await RefundRecord.create(
        {
          orderId,
          refundNo,
          refundFee,
          refundDesc,
          status: "PROCESSING",
          operator,
        },
        { transaction: t },
      );

      await order.update(
        {
          status: OrderStatus.REFUNDING,
          refundStatus: "PROCESSING",
          refundFee: order.refundFee + refundFee,
          refundNo,
        },
        { transaction: t },
      );

      logger.info(`[Order] 退款申请: ${order.orderNo}, 金额: ${refundFee}分`);
      return { order, record };
    });
  }

  async refundSuccess(
    orderId: number,
    refundNo: string,
    transaction?: Transaction,
  ) {
    const order = await Order.findByPk(orderId, { transaction });
    if (!order) throw new BusinessError(400, "订单不存在");

    const isFullRefund = order.refundFee >= order.totalFee;
    const newStatus = isFullRefund
      ? OrderStatus.REFUNDED
      : OrderStatus.PARTIAL_REFUND;

    await order.update(
      { status: newStatus, refundStatus: "SUCCESS" },
      { transaction },
    );

    const record = await RefundRecord.findOne({
      where: { refundNo },
      transaction,
    });
    if (record) await record.update({ status: "SUCCESS" }, { transaction });

    logger.info(`[Order] 退款成功: ${order.orderNo} → ${newStatus}`);
    return order;
  }

  async refundFail(orderId: number, refundNo: string, errorMsg: string) {
    const { sequelize } = await import("../config/database");
    return sequelize.transaction(async (t) => {
      const order = await Order.findByPk(orderId, { transaction: t });
      if (!order) throw new BusinessError(400, "订单不存在");

      const record = await RefundRecord.findOne({
        where: { refundNo },
        transaction: t,
      });
      const failFee = record?.refundFee || 0;
      const restoredFee = Math.max(0, order.refundFee - failFee);
      const prevStatus =
        restoredFee > 0 ? OrderStatus.PARTIAL_REFUND : OrderStatus.PAID;

      await order.update(
        {
          status: prevStatus,
          refundStatus: "FAIL",
          refundFee: restoredFee,
        },
        { transaction: t },
      );

      if (record)
        await record.update({ status: "FAIL", errorMsg }, { transaction: t });

      logger.info(
        `[Order] 退款失败: ${order.orderNo}, 恢复状态: ${prevStatus}`,
      );
      return order;
    });
  }

  async getOrderStats() {
    const today = dayjs().format("YYYY-MM-DD");
    const [pendingCount, paidCount, refundedCount, todayOrders] =
      await Promise.all([
        Order.count({ where: { status: OrderStatus.PENDING } }),
        Order.count({ where: { status: OrderStatus.PAID } }),
        Order.count({
          where: {
            status: {
              [Op.in]: [
                OrderStatus.REFUNDED,
                OrderStatus.PARTIAL_REFUND,
                OrderStatus.REFUNDING,
              ],
            },
          },
        }),
        Order.findAll({
          where: {
            createdAt: { [Op.gte]: today, [Op.lte]: today + " 23:59:59" },
          },
          attributes: ["totalFee", "status"],
        }),
      ]);
    return {
      pending: pendingCount,
      paid: paidCount,
      refunded: refundedCount,
      todayTotal: todayOrders.length,
      todayAmount: todayOrders.reduce(
        (sum, o) => sum + (o.status === OrderStatus.PAID ? o.totalFee : 0),
        0,
      ),
    };
  }
}

export default new OrderService();
