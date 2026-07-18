<script setup lang="ts">
defineOptions({ name: 'SPageContainer' })

defineProps<{
  title: string
  breadcrumb?: string[]
}>()
</script>

<template>
  <div class="s-page-container">
    <a-page-header
      :title="title"
      :breadcrumb="
        breadcrumb
          ? { items: breadcrumb.map((name) => ({ title: name })) }
          : undefined
      "
    />
    <div class="s-page-content">
      <slot />
    </div>
  </div>
</template>

<style scoped lang="less">
.s-page-container {
  .s-page-content {
    padding: 0;
  }
}
</style>
