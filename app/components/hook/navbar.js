// navbar.js
import {
	computed
} from 'vue'

export const useNavbarHeight = () => {
	const {
		safeAreaInsets,
		statusBarHeight
	} = uni.getWindowInfo()
	const {
		platform
	} = uni.getDeviceInfo()

	// 顶部安全区高度（状态栏占位）
	const safeAreaTop = safeAreaInsets.top !== 0 ? safeAreaInsets.top : (statusBarHeight || 24)

	// 获取胶囊信息
	const menuButton = uni.getMenuButtonBoundingClientRect()
	const hasMenuButton = !!menuButton && menuButton.top && menuButton.height

	// 标题栏高度（通常与胶囊高度一致）
	const titleBarHeight = hasMenuButton ? menuButton.height : (platform === 'ios' ? 44 : 56)
	// 标题栏顶部到状态栏底部的距离（即与胶囊对齐所需的上边距）
	const titleBarMarginTop = hasMenuButton ? (menuButton.top - safeAreaTop) : 0

	// 导航栏总高度（状态栏 + 标题栏）
	const navbarHeight = safeAreaTop + titleBarHeight + titleBarMarginTop

	return {
		safeAreaTop, // 状态栏占位高度（px）
		titleBarHeight, // 标题栏高度（px）
		titleBarMarginTop, // 标题栏上边距（px）
		navbarHeight, // 整个导航栏容器高度（px）
	}
}