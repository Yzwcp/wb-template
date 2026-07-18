import { Request, Response } from 'express';
import { callbackQueue } from '../config/queue';
import wechatService from '../services/wechat.service';
import logger from '../utils/logger';

/**
 * 统一回调入口 — 支付/退款通知
 *
 * WeChat 通知类型区分：
 *   支付回调 XML: <out_trade_no>, <transaction_id>, <total_fee>, ...
 *   退款回调 XML: <req_info> (加密的退款详情)
 *
 * 流程：tenpay 解析验证 → 入 BullMQ → 立即返回 SUCCESS 给微信
 *   微信支付 V2 要求 5 秒内响应，否则会重复通知
 */

export async function notify(req: Request, res: Response): Promise<void> {
  try {
    const raw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

    // 快速判断类型：退款通知包含 <req_info>
    const isRefund = raw.includes('<req_info>') || raw.includes('req_info');
    const type = isRefund ? 'refund' : 'payment';
    logger.info(`[Callback] 收到 ${type} 通知`);

    // 用 tenpay 解析+验签（不自己解析 XML）
    const client = await wechatService.getClient();
    const parseType = isRefund ? 'middleware_refund' : 'middleware_pay';
    const parsed: any = await (client as any)._parse(raw, parseType);

    // 入 BullMQ 异步处理
    if (isRefund) {
      // req_info 已被 tenpay 解密为对象
      const info = parsed.req_info || {};
      await callbackQueue.add('refund-callback', {
        type: 'refund',
        data: {
          outRefundNo: info.out_refund_no || '',
          refundStatus: info.refund_status || info.refund_status_0 || '',
        },
      });
      logger.info(`[Callback] 退款入队: outRefundNo=${info.out_refund_no}`);
    } else {
      await callbackQueue.add('pay-callback', {
        type: 'payment',
        data: {
          outTradeNo: parsed.out_trade_no,
          transactionId: parsed.transaction_id || '',
          totalFee: parseInt(parsed.total_fee || '0'),
          timeEnd: parsed.time_end || '',
          openid: parsed.openid || '',
        },
      });
      logger.info(`[Callback] 支付入队: outTradeNo=${parsed.out_trade_no}`);
    }

    // 立即返回成功（微信要求 5s 内）
    res.type('xml').send(
      '<xml><return_code><![CDATA[SUCCESS]]></return_code><return_msg><![CDATA[OK]]></return_msg></xml>',
    );
  } catch (err: any) {
    logger.error(`[Callback] 解析失败: ${err.message}`);
    res.type('xml').send(
      '<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[Parse Error]]></return_msg></xml>',
    );
  }
}
