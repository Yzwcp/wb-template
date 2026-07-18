import { Request, Response } from "express";
import { callbackQueue } from "../config/queue";
import wechatService from "../services/wechat.service";
import {
  processPayCallback,
  processRefundCallback,
} from "../jobs/process-callback";
import logger from "../utils/logger";

/**
 * 统一回调入口 — 支付/退款通知
 *
 * WeChat 通知类型区分：
 *   支付回调 XML: <out_trade_no>, <transaction_id>, <total_fee>, ...
 *   退款回调 XML: <req_info> (加密的退款详情)
 *
 * 流程：tenpay 解析验证 → 优先入 BullMQ 队列 → 立即返回 SUCCESS
 *   如果队列不可用（Redis 未连接等），降级为直接异步处理
 *   微信支付 V2 要求 5 秒内响应，否则会重复通知
 */

export async function notify(req: Request, res: Response): Promise<void> {
  // 无论成败，统一回复 SUCCESS，避免微信重复推送
  const replySuccess = () => {
    res
      .type("xml")
      .send(
        "<xml><return_code><![CDATA[SUCCESS]]></return_code><return_msg><![CDATA[OK]]></return_msg></xml>",
      );
  };
  const replyFail = (msg: string) => {
    res
      .type("xml")
      .send(
        `<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[${msg}]]></return_msg></xml>`,
      );
  };

  let raw: string;
  try {
    raw = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
  } catch (bodyErr: any) {
    logger.error(`[Callback] 读取请求体失败: ${bodyErr.message}`);
    replyFail("BodyError");
    return;
  }

  // 空通知直接返回成功（微信偶发空探测请求）
  if (!raw || raw.trim().length === 0) {
    logger.warn("[Callback] 收到空通知");
    replySuccess();
    return;
  }

  // 快速判断类型：退款通知包含 <req_info>
  const isRefund = raw.includes("<req_info>") || raw.includes("req_info");
  const type = isRefund ? "refund" : "payment";
  logger.info(
    `[Callback] 收到 ${type} 通知, body前200字: ${raw.slice(0, 200)}`,
  );

  // 用 tenpay 解析+验签
  let client: any;
  let parsed: any;
  try {
    client = await wechatService.getClient();
    const parseType = isRefund ? "middleware_refund" : "middleware_pay";
    parsed = await client._parse(raw, parseType);
  } catch (parseErr: any) {
    logger.error(`[Callback] 解析/验签失败: ${parseErr.message}`, {
      raw: raw.slice(0, 500),
      error: parseErr.stack || parseErr.message,
    });
    replyFail("ParseError");
    return;
  }

  // 构建业务数据
  let jobName: string;
  let jobData: any;

  if (isRefund) {
    const info = parsed.req_info || {};
    jobName = "refund-callback";
    jobData = {
      type: "refund",
      data: {
        outRefundNo: info.out_refund_no || "",
        refundStatus: info.refund_status || info.refund_status_0 || "",
      },
    };
  } else {
    jobName = "pay-callback";
    jobData = {
      type: "payment",
      data: {
        outTradeNo: parsed.out_trade_no,
        transactionId: parsed.transaction_id || "",
        totalFee: parseInt(parsed.total_fee || "0"),
        timeEnd: parsed.time_end || "",
        openid: parsed.openid || "",
      },
    };
  }

  // 优先入队（快，不阻塞响应）；队列不可用时降级为直接处理
  let queued = false;
  try {
    await callbackQueue.add(jobName, jobData);
    queued = true;
    logger.info(
      `[Callback] ${jobName} 入队成功, outTradeNo=${jobData.data.outTradeNo || jobData.data.outRefundNo}`,
    );
  } catch (queueErr: any) {
    logger.warn(
      `[Callback] 队列不可用 (${queueErr.message}), 降级为直接异步处理`,
    );
    // 不 await 直接处理，避免超时
    const processFn = isRefund ? processRefundCallback : processPayCallback;
    processFn(jobData.data).catch((procErr: any) => {
      logger.error(`[Callback] 降级处理失败: ${procErr.message}`);
    });
  }

  replySuccess();
}
