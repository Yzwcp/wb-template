<template>
    <view
        class="navbar-container"
        :style="{
            paddingTop: safeAreaTop + 'px',
            height: navbarHeight + 'px'
        }"
    >
        <view
            class="title-bar"
            :style="{
                height: titleBarHeight + 'px',
                marginTop: titleBarMarginTop + 'px'
            }"
        ></view>
    </view>
</template>

<script setup>
import { useNavbarHeight } from './hook/navbar.js'

const { safeAreaTop, titleBarHeight, titleBarMarginTop, navbarHeight } = useNavbarHeight()
</script>

<style scoped>
.navbar-container {
    position: fixed;
    top: 0;
    z-index: 99999;
    background-color: transparent; /* 根据实际背景色调整 */
    box-sizing: border-box;
}
.title-bar {
    background-color: transparent; /* 根据实际背景色调整 */
    align-items: center;
    display: flex;
    align-items: center;
    width: 100%;
}
</style>
