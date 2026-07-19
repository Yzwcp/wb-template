import { defineStore } from "pinia";
import { ref } from "vue";

// ===== localStorage 持久化工具 =====
const PREFIX = "persist:";
function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}
function saveJSON(key: string, val: any) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(val));
  } catch {}
}

const K_SIDEBAR = "sidebar";
const K_THEME = "theme";

export const useAppStore = defineStore("app", () => {
  const sidebarCollapsed = ref(loadJSON(K_SIDEBAR, false));
  const theme = ref<"light" | "dark">(loadJSON(K_THEME, "light"));

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value;
    saveJSON(K_SIDEBAR, sidebarCollapsed.value);
  }

  function setTheme(t: "light" | "dark") {
    theme.value = t;
    saveJSON(K_THEME, t);
  }

  return {
    sidebarCollapsed,
    theme,
    toggleSidebar,
    setTheme,
  };
});
