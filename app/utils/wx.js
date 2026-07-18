import * as ww from "@wecom/jssdk";

/**
 * 初始化企业微信 JSSDK
 *
 * @param {Object} options
 * @param {string} options.corpId      - 企业ID
 * @param {Function} options.getConfigSignature - config签名生成函数，签收 (url) => { timestamp, nonceStr, signature }
 * @param {string[]} [options.jsApiList] - 需要使用的JS接口列表，默认包含 getLocation 所需的 geoLocation
 *
 * @example
 * import { initWework } from "@/utils/wx";
 *
 * initWework({
 *   corpId: "ww7ca4776b2a70000",
 *   async getConfigSignature(url) {
 *     const res = await fetch(`/api/signature?url=${encodeURIComponent(url)}`);
 *     const data = await res.json();
 *     return { timestamp: data.timestamp, nonceStr: data.nonceStr, signature: data.signature };
 *   },
 * });
 */
export function initWework(options = {}) {
  const { corpId, getConfigSignature, jsApiList } = options;

  if (!corpId) {
    console.error("[wx] initWework 缺少必要参数 corpId");
    return;
  }

  const apiList = jsApiList || ["geoLocation"];

  ww.register({
    corpId,
    jsApiList: apiList,
    async getConfigSignature(url) {
      if (typeof getConfigSignature === "function") {
        return getConfigSignature(url);
      }
      console.warn(
        "[wx] getConfigSignature 未提供，部分 JS-SDK 接口将无法使用",
      );
      return { timestamp: Date.now(), nonceStr: "", signature: "" };
    },
    onConfigFail(res) {
      console.error("[wx] config 初始化失败:", res);
    },
  });

  // 等待 config 就绪
  return ww.ensureCorpConfigReady();
}

/**
 * 获取地理位置
 *
 * @param {Object} [options]
 * @param {'wgs84' | 'gcj02'} [options.type='wgs84'] - 坐标类型，gcj02 为火星坐标（可直接用于地图显示）
 * @returns {Promise<{ latitude: number, longitude: number, speed: number, accuracy: number }>}
 *
 * @example
 * import { getLocation } from "@/utils/wx";
 *
 * const loc = await getLocation({ type: "gcj02" });
 * console.log(loc.latitude, loc.longitude);
 */
export function getLocation(options = {}) {
  return new Promise((resolve, reject) => {
    ww.getLocation({
      type: options.type || "wgs84",
      success(res) {
        resolve({
          latitude: res.latitude,
          longitude: res.longitude,
          speed: res.speed || 0,
          accuracy: res.accuracy,
        });
      },
      fail(err) {
        reject(err);
      },
    });
  });
}
