import axios from "axios";
import * as fs from "fs";
import Tenpay from "tenpay";
import globalConfigService from "./globalConfig.service";
import { redis } from "../config/redis";
import logger from "../utils/logger";
import { BusinessError } from "../utils/response";
import path from "path";

// 模块级 Tenpay 客户端缓存
let cachedClient: any = null;
let cachedConfigId: number | null = null;

class WechatService {
  /**
   * 获取微信支付客户端实例（带缓存）
   */
  async getClient() {
    const active = await globalConfigService.getActive();
    if (!active) {
      throw new BusinessError(400, "未找到启用的全局配置");
    }
    const config = active.wechatConfig;
    if (!config) {
      throw new BusinessError(400, "启用的配置中未设置微信小程序配置");
    }

    // 如果配置未变化，返回缓存的客户端
    if (cachedClient && cachedConfigId === active.id) {
      return cachedClient;
    }

    // 读取证书文件
    let pfx: Buffer | undefined;

    if (
      config.pfxPath &&
      fs.existsSync(path.resolve(__dirname, config.pfxPath))
    ) {
      pfx = fs.readFileSync(path.resolve(__dirname, config.pfxPath));
    }

    cachedClient = new Tenpay({
      appid: config.appId,
      mchid: config.paymentMchId,
      partnerKey: config.paymentKey,
      pfx,
      notify_url: config.notifyUrl,
      refund_url: config.refundNotifyUrl,
      passphrase: config.paymentMchId,
    });

    cachedConfigId = active.id;
    logger.info("[Wechat] 微信支付客户端已初始化");
    return cachedClient;
  }

  /**
   * 获取 AccessToken（带 Redis 缓存）
   */
  async getAccessToken(): Promise<string> {
    const cacheKey = "wechat:access_token";

    // 先从缓存获取
    const cached = await redis.get(cacheKey);
    if (cached) {
      return cached;
    }

    const config = await globalConfigService.getWechatConfig();
    if (!config) {
      throw new BusinessError(400, "启用的配置中未设置微信小程序配置");
    }

    const { data } = await axios.get(
      "https://api.weixin.qq.com/cgi-bin/token",
      {
        params: {
          grant_type: "client_credential",
          appid: config.appId,
          secret: config.secret,
        },
      },
    );

    if (data.errcode) {
      logger.error("[Wechat] 获取 access_token 失败:", data);
      throw new BusinessError(500, `获取 access_token 失败: ${data.errmsg}`);
    }

    // 缓存，提前 300 秒过期
    const ttl = Math.max(data.expires_in - 300, 60);
    await redis.setex(cacheKey, ttl, data.access_token);
    logger.info(`[Wechat] access_token 已缓存，TTL: ${ttl}s`);

    return data.access_token;
  }

  /**
   * 获取用户 OpenID（小程序登录）
   */
  async getOpenid(code: string) {
    const config = await globalConfigService.getWechatConfig();
    if (!config) {
      throw new BusinessError(400, "启用的配置中未设置微信小程序配置");
    }

    const { data } = await axios.get(
      "https://api.weixin.qq.com/sns/jscode2session",
      {
        params: {
          appid: config.appId,
          secret: config.secret,
          js_code: code,
          grant_type: "authorization_code",
        },
      },
    );

    if (data.errcode) {
      logger.error("[Wechat] 获取 openid 失败:", data);
      throw new BusinessError(500, `获取 openid 失败: ${data.errmsg}`);
    }

    return {
      openid: data.openid,
      session_key: data.session_key,
      unionid: data.unionid,
    };
  }

  /**
   * 获取用户手机号
   */
  async getPhone(code: string) {
    const accessToken = await this.getAccessToken();

    const { data } = await axios.post(
      `https://api.weixin.qq.com/wxa/business/getuserphonenumber?access_token=${accessToken}`,
      { code },
    );

    if (data.errcode !== 0) {
      logger.error("[Wechat] 获取手机号失败:", data);
      throw new BusinessError(500, `获取手机号失败: ${data.errmsg}`);
    }

    return data.phone_info;
  }

  /**
   * 发送订阅消息
   */
  async sendSubscribeMessage(
    openid: string,
    templateId: string,
    data: Record<string, { value: string }>,
    page?: string,
  ) {
    const accessToken = await this.getAccessToken();

    const body: any = {
      touser: openid,
      template_id: templateId,
      data,
    };

    if (page) {
      body.page = page;
    }

    const { data: result } = await axios.post(
      `https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=${accessToken}`,
      body,
    );

    if (result.errcode !== 0) {
      logger.error("[Wechat] 发送订阅消息失败:", result);
      throw new BusinessError(500, `发送订阅消息失败: ${result.errmsg}`);
    }

    return result;
  }

  /**
   * 统一下单（JSAPI 支付）
   */
  async unifiedOrder(params: {
    outTradeNo: string;
    body: string;
    totalFee: number;
    openid: string;
    notifyUrl?: string;
  }) {
    const client = await this.getClient();

    const orderParams: any = {
      out_trade_no: params.outTradeNo,
      body: params.body,
      total_fee: params.totalFee,
      openid: params.openid,
      trade_type: "JSAPI",
    };

    if (params.notifyUrl) {
      orderParams.notify_url = params.notifyUrl;
    }

    logger.info("[Wechat] 统一下单:", orderParams);

    const result = await client.unifiedOrder(orderParams);

    // 生成小程序支付参数
    const payParams = client.getPayParamsByPrepay({
      prepay_id: result.prepay_id,
    });

    return {
      prepay_id: result.prepay_id,
      payParams,
      orderInfo: result,
    };
  }

  /**
   * 查询订单
   */
  async queryOrder(params: { outTradeNo?: string; transactionId?: string }) {
    const client = await this.getClient();

    const queryParams: any = {};
    if (params.transactionId) {
      queryParams.transaction_id = params.transactionId;
    } else if (params.outTradeNo) {
      queryParams.out_trade_no = params.outTradeNo;
    } else {
      throw new BusinessError(400, "outTradeNo 或 transactionId 必须提供其一");
    }

    logger.info("[Wechat] 查询订单:", queryParams);
    const result = await client.orderQuery(queryParams);

    return {
      trade_state: result.trade_state,
      trade_state_desc: result.trade_state_desc,
      transaction_id: result.transaction_id,
      out_trade_no: result.out_trade_no,
      total_fee: parseInt(result.total_fee),
      time_end: result.time_end,
      ...result,
    };
  }

  /**
   * 申请退款
   */
  async refund(params: {
    outTradeNo: string;
    outRefundNo: string;
    totalFee: number;
    refundFee: number;
    refundDesc?: string;
  }) {
    const client = await this.getClient();

    const refundParams: any = {
      out_trade_no: params.outTradeNo,
      out_refund_no: params.outRefundNo,
      total_fee: params.totalFee,
      refund_fee: params.refundFee,
    };

    if (params.refundDesc) {
      refundParams.refund_desc = params.refundDesc;
    }

    logger.info("[Wechat] 申请退款:", refundParams);
    const result = await client.refund(refundParams);

    return result;
  }

  /**
   * 查询退款
   */
  async queryRefund(outRefundNo: string) {
    const client = await this.getClient();

    logger.info("[Wechat] 查询退款:", outRefundNo);
    const result = await client.refundQuery({
      out_refund_no: outRefundNo,
    });

    return result;
  }

  /**
   * 清除客户端缓存（配置变更时调用）
   */
  clearClientCache() {
    cachedClient = null;
    cachedConfigId = null;
    logger.info("[Wechat] 支付客户端缓存已清除");
  }
}

export default new WechatService();
