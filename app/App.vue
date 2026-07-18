<script>
import { useGlobalStore } from "./store/global.js";
import { storeToRefs } from "pinia";
import { debugConfig } from "@/utils/config";
import VConsole from "vconsole";
export default {
  onLaunch: async function () {
    // #ifdef H5
    if (debugConfig.enabled) {
      new VConsole();
      console.log("[vconsole] 调试工具已启动");
    }
    // #endif

    const globalStore = useGlobalStore();
    await globalStore.initSystemInfo();

    // 小程序环境：尝试静默登录（wx.login → jscode2session → token）
    // #ifdef MP-WEIXIN
    await globalStore.login();
    // #endif
  },
  onShow: function () {
    console.log("App Show");
  },
  onHide: function () {
    console.log("App Hide");
  },
};
</script>

<style lang="scss">
.uni-scroll-view-refresher {
  background-color: rgba(0, 0, 0, 0) !important;
}
</style>
