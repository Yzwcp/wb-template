<template>
  <view class="dict-select" @click="open">
    <view class="dict-select__inner">
      <text v-if="displayLabel" class="dict-select__text">{{
        displayLabel
      }}</text>
      <text v-else class="dict-select__placeholder">{{ placeholder }}</text>
      <wd-icon name="arrow" size="14px" color="#999" />
    </view>
    <wd-select-picker
    filterable
      v-model="innerValue"
      :columns="columns"
      :title="title"
      :type="type"
      :loading="loading"
      v-model:visible="visible"
      @confirm="onConfirm"
      @cancel="onCancel"
    />
  </view>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { useDict } from "@/hooks/useDict";

const { dictMap } = useDict();

const props = defineProps({
  modelValue: { type: [String, Number, Array], default: "" },
  dictKey: { type: String, required: true },
  title: { type: String, default: "" },
  placeholder: { type: String, default: "请选择" },
  /** 单选 radio / 多选 checkbox */
  type: { type: String, default: "radio" },
});

const emit = defineEmits(["update:modelValue"]);

const visible = ref(false);
const loading = ref(false);
const innerValue = ref(props.modelValue);
let closeGuard = false;

watch(
  () => props.modelValue,
  (val) => {
    innerValue.value = val;
  },
);

const columns = computed(() => {
  const list = dictMap[props.dictKey] || [];
  return list.map((i) => ({
    label: i.dictLabel || i.label,
    value: i.dictValue || i.value,
  }));
});

const displayLabel = computed(() => {
  if (props.type === "checkbox" && Array.isArray(innerValue.value)) {
    const labels = innerValue.value
      .map((v) => {
        const item = columns.value.find((c) => c.value === v);
        return item ? item.label : "";
      })
      .filter(Boolean);
    return labels.join("、") || "";
  }
  const item = columns.value.find((c) => c.value === innerValue.value);
  return item ? item.label : "";
});

function open() {
  if (closeGuard) return;
  innerValue.value = props.modelValue;
  visible.value = true;
}

function onConfirm({ value }) {
  emit("update:modelValue", value);
  closeGuard = true;
  setTimeout(() => {
    closeGuard = false;
  }, 300);
}

function onCancel() {
  closeGuard = true;
  setTimeout(() => {
    closeGuard = false;
  }, 300);
}
</script>

<style scoped>
.dict-select {
  width: 100%;
}

.dict-select__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #f8f9fa;
  border-radius: 12rpx;
  padding: 16rpx 24rpx;
  min-height: 48rpx;
}

.dict-select__text {
  font-size: 28rpx;
  color: #333;
  flex: 1;
}

.dict-select__placeholder {
  font-size: 28rpx;
  color: #999;
  flex: 1;
}
</style>
