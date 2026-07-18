import { loginType, imageUrl } from "./config";
import smCrypto from "sm-crypto";

export function padToElevenDigits(num) {
  // 将输入转换为字符串
  const str = String(num);
  // 补全到11位
  const padded =
    str.length >= 11 ? str.slice(0, 11) : "0".repeat(11 - str.length) + str;
  // 每4位加一个空格，格式：0000 0000 001
  return padded.replace(/(\d{4})(?=\d)/g, "$1 ");
}

/**
 * 从指定位置开始截取指定数量的字符
 * @param {string} str - 原始字符串
 * @param {number} start - 开始位置（从0开始）
 * @param {number} count - 要截取的字符数量
 * @returns {string} 截取后的子字符串
 */
export function substringFrom(str, start, count) {
  // 参数校验
  if (typeof str !== "string") {
    throw new TypeError("第一个参数必须是字符串");
  }

  if (typeof start !== "number" || typeof count !== "number") {
    throw new TypeError("开始位置和字符数量必须是数字");
  }

  // 处理负数情况
  start = Math.max(0, start);
  count = Math.max(0, count);

  // 确保不超过字符串长度
  const end = Math.min(start + count, str.length);

  return str.substring(start, end);
}

export function navigateToLogin() {
  uni.navigateTo({
    url: `/pages/auth/${loginType}-login`,
  });
}

export function mergeImg(name) {
  if (!name) return "";
  return imageUrl + name;
}

/**
 * 通用的设备信息获取工具类
 * 兼容 App、微信小程序、H5 等多端
 */
export const getDeviceInfo = () => {
  try {
    // 基础系统信息
    const systemInfo = uni.getSystemInfoSync();

    // 整理核心设备信息
    const deviceInfo = {
      // 基础屏幕信息
      screenWidth: systemInfo.screenWidth, // 屏幕宽度（px）
      screenHeight: systemInfo.screenHeight, // 屏幕高度（px）
      windowWidth: systemInfo.windowWidth, // 可使用窗口宽度（px）
      windowHeight: systemInfo.windowHeight, // 可使用窗口高度（px）

      // 设备相关
      pixelRatio: systemInfo.pixelRatio, // 设备像素比
      model: systemInfo.model, // 设备型号（如 iPhone 13）
      system: systemInfo.system, // 系统版本（如 iOS 15.0、Android 12）
      platform: systemInfo.platform, // 平台（ios/android/h5/mp-weixin 等）

      // 状态栏/安全区域（重点兼容）
      statusBarHeight: systemInfo.statusBarHeight || 0, // 状态栏高度
      safeArea: systemInfo.safeArea || {}, // 安全区域信息

      // 导航栏相关（常用默认值，可根据需求调整）
      navBarHeight: systemInfo.statusBarHeight
        ? systemInfo.statusBarHeight + 44
        : 44,

      // 可使用高度（扣除状态栏+导航栏）
      usableHeight:
        systemInfo.windowHeight - (systemInfo.statusBarHeight || 0) - 44,
    };

    // 针对微信小程序额外处理胶囊按钮（更精准的导航栏高度）
    if (systemInfo.platform === "mp-weixin") {
      const menuButtonInfo = uni.getMenuButtonBoundingClientRect?.() || {};
      if (menuButtonInfo.height) {
        // 微信小程序胶囊按钮计算真实导航栏高度
        deviceInfo.navBarHeight =
          (menuButtonInfo.top - systemInfo.statusBarHeight) * 2 +
          menuButtonInfo.height;
        // 重新计算可用高度
        deviceInfo.usableHeight =
          systemInfo.windowHeight -
          systemInfo.statusBarHeight -
          deviceInfo.navBarHeight;
      }
    }

    return {
      success: true,
      data: deviceInfo,
    };
  } catch (error) {
    console.error("获取设备信息失败：", error);
    return {
      success: false,
      message: "获取设备信息失败",
      error,
    };
  }
};

export function generateSimpleUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0; // 随机生成 0-15 的整数
    const v = c === "x" ? r : (r & 0x3) | 0x8; // 处理 y 字符
    return v.toString(16);
  });
}
export function getFileExtension(filePath) {
  // 处理空路径或非字符串输入
  if (typeof filePath !== "string" || filePath.trim() === "") {
    return "";
  }

  // 替换反斜杠为斜杠，统一路径格式
  const normalizedPath = filePath.replace(/\\/g, "/");

  // 分割路径，获取最后一个部分（文件名）
  const fileName = normalizedPath.split("/").pop();

  // 检查文件名中是否包含扩展名分隔符（.）
  const dotIndex = fileName.lastIndexOf(".");

  // 处理特殊情况：
  // - 无扩展名（如 "file" 或 ".gitignore" 这种隐藏文件）
  // - 文件名以点结尾（如 "file."）
  if (dotIndex <= 0 || dotIndex === fileName.length - 1) {
    return "";
  }

  // 返回扩展名（不包含点，且转为小写，统一格式）
  return fileName.slice(dotIndex + 1).toLowerCase();
}

const sm2 = smCrypto.sm2;
const cipherMode = 1; // 1 - C1C3C2，0 - C1C2C3，默认为1
const publicKey =
  "04a092c445b6020925332912350bdbea9ae42bff2b0d001b55419313b382265c5b0a0911d120a11a5e29675062846bf3080ac24a1af983ecd44f0299b13f032cbf";

// SM2加密
export function doSm2Encrypt(msgString) {
  return sm2.doEncrypt(msgString, publicKey, cipherMode);
}
// SM2数组加密
export function doSm2ArrayEncrypt(msgString) {
  return sm2.doEncrypt(msgString, publicKey, cipherMode);
}

/**
 * 获取指定元素的高度
 * @param {string} selector - CSS选择器，如 '#id' 或 '.class'
 * @param {Object} [context] - 组件实例，页面中无需传入，组件内需传当前实例
 * @returns {Promise<number>} 元素高度（px）
 *
 * @example
 * const height = await getElementHeight('#list-top')
 * console.log(height) // 120
 */
export function getElementHeight(selector, context) {
  return new Promise((resolve) => {
    const query = context
      ? uni.createSelectorQuery().in(context)
      : uni.createSelectorQuery();
    query
      .select(selector)
      .boundingClientRect((rect) => {
        if (rect) {
          resolve(rect.height);
        } else {
          console.warn(`[getElementHeight] 未找到元素: ${selector}`);
          resolve(0);
        }
      })
      .exec();
  });
}

// ==================== 地址缓存 Map ====================
const ADDRESS_URL =
  "https://djxz.oss-cn-hangzhou.aliyuncs.com/wj/address_min.json";

// code -> item 的快速索引
const codeMap = new Map();
// code -> 完整地址路径 的缓存
const pathCache = new Map();

let addressLoaded = false;
let addressPromise = null;

/**
 * 从远程加载行政区划数据并建立索引缓存
 * @returns {Promise<Array>} 原始数据数组
 */
export function loadAddressData() {
  if (addressLoaded) return Promise.resolve();
  if (addressPromise) return addressPromise;

  addressPromise = new Promise((resolve, reject) => {
    uni.request({
      url: ADDRESS_URL,
      success: (res) => {
        const data = res.data;
        buildAddressIndex(data);
        addressLoaded = true;
        resolve(data);
      },
      fail: (err) => {
        console.error("[loadAddressData] 加载失败：", err);
        addressPromise = null;
        reject(err);
      },
    });
  });

  return addressPromise;
}

/**
 * 构建 code -> item 的索引
 */
function buildAddressIndex(provinces) {
  codeMap.clear();
  pathCache.clear();

  for (const province of provinces) {
    codeMap.set(province.code, province);
    if (province.children) {
      for (const city of province.children) {
        codeMap.set(city.code, city);
        if (city.children) {
          for (const district of city.children) {
            codeMap.set(district.code, district);
          }
        }
      }
    }
  }
}

/**
 * 根据code获取行政区划名称
 * @param {string} code - 行政区划代码
 * @returns {string} 名称，未找到返回空字符串
 */
export function getNameByCode(code) {
  const item = codeMap.get(code);
  return item ? item.name : "";
}

/**
 * 根据code获取完整地址路径（省/市/区）
 * @param {string} districtCode - 区级代码（6位）
 * @returns {string} 完整地址，如"广东省/深圳市/南山区"
 */
export function getFullAddressByCode(districtCode) {
  if (pathCache.has(districtCode)) return pathCache.get(districtCode);

  const district = codeMap.get(districtCode);
  if (!district) return "";

  // 区级代码前4位是市级代码，前2位是省级代码
  const cityCode = districtCode.substring(0, 4) + "00";
  const provinceCode = districtCode.substring(0, 2) + "0000";

  const city = codeMap.get(cityCode);
  const province = codeMap.get(provinceCode);

  const path = [province, city, district]
    .filter(Boolean)
    .map((item) => item.name)
    .join("/");

  pathCache.set(districtCode, path);
  return path;
}

/**
 * 获取省份列表
 * @returns {Array<{code: string, name: string}>}
 */
export function getProvinces() {
  const result = [];
  for (const [code, item] of codeMap) {
    // 省份code以0000结尾
    if (code.endsWith("0000")) {
      result.push({ code, name: item.name });
    }
  }
  return result;
}

/**
 * 获取城市列表
 * @param {string} provinceCode - 省份代码
 * @returns {Array<{code: string, name: string}>}
 */
export function getCities(provinceCode) {
  const province = codeMap.get(provinceCode);
  if (!province || !province.children) return [];
  return province.children.map((c) => ({ code: c.code, name: c.name }));
}

/**
 * 获取区/县列表
 * @param {string} cityCode - 城市代码
 * @returns {Array<{code: string, name: string}>}
 */
export function getDistricts(cityCode) {
  const city = codeMap.get(cityCode);
  if (!city || !city.children) return [];
  return city.children.map((d) => ({ code: d.code, name: d.name }));
}

// ==================== 派出所数据缓存 Map ====================
const POLICE_URL =
  "https://djxz.oss-cn-hangzhou.aliyuncs.com/wj/police_station.json";

// { "区名": ["派出所1", "派出所2", ...], ... }
let policeData = {};
let policeLoaded = false;
let policePromise = null;

/**
 * 从远程加载派出所数据
 * @returns {Promise<Object>} 原始派出所数据
 */
export function loadPoliceStationData() {
  if (policeLoaded) return Promise.resolve(policeData);
  if (policePromise) return policePromise;

  policePromise = new Promise((resolve, reject) => {
    uni.request({
      url: POLICE_URL,
      success: (res) => {
        policeData = res.data || {};
        policeLoaded = true;
        resolve(policeData);
      },
      fail: (err) => {
        console.error("[loadPoliceStationData] 加载失败：", err);
        policePromise = null;
        reject(err);
      },
    });
  });

  return policePromise;
}

/**
 * 获取所有区/县名称列表
 * @returns {string[]}
 */
export function getPoliceDistrictList() {
  return Object.keys(policeData);
}

/**
 * 根据区/县名称获取该区下派出所列表
 * @param {string} districtName - 区/县名称
 * @returns {string[]}
 */
export function getPoliceStationList(districtName) {
  return policeData[districtName] || [];
}
