//api接口
// export const baseUrl = 'https://form.win.shengdajia.cn/api'
export const baseUrl = "http://localhost:3000";
// export const baseUrl = "https://nyq.win.shengdajia.cn";

export const imageUrl = "https://tbwork.shengdajia.cn/public";
// export const requestType = 'client'
//空: openid登录 account账号密码
export const loginType = "account";
// export const
// 企业微信配置
export const weworkConfig = {
  corpId: "wxe7e2fa35ea164594", // TODO: 填写企业微信的企业ID（corpId）
  agentId: "", // TODO: 填写应用的AgentId（如需要）
};
// vconsole 远程调试工具配置
export const debugConfig = {
  enabled: true, // 是否启用 vconsole，线上环境建议改为 false
};
//首页组件数据展示组件 ITextList  ICard  IImage
export const indexPageCompoent = "ICard";
//阿里oss地址
export const uploadBaseUrl = true ? baseUrl + "/pub/local/upload" : "-";
