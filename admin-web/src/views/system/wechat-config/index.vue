<script setup lang="ts">
import { ref, h } from "vue";
import { message, Modal } from "ant-design-vue";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
} from "@ant-design/icons-vue";
import * as globalConfigApi from "@/api/globalConfig";
import type {
  GlobalConfigRecord,
  WechatAppConfig,
  OssConfig,
} from "@/api/globalConfig";

defineOptions({ name: "GlobalConfig" });

const loading = ref(false);
const dataList = ref<GlobalConfigRecord[]>([]);
const modalVisible = ref(false);
const editingRecord = ref<GlobalConfigRecord | null>(null);
const submitting = ref(false);

const columns = [
  { title: "配置名称", dataIndex: "name", width: 150 },
  {
    title: "微信配置",
    dataIndex: "wechatConfig",
    width: 100,
    customRender: ({ text }: any) =>
      text ? h("a-tag", { color: "blue" }, "已配置") : h("a-tag", {}, "未配置"),
  },
  {
    title: "OSS配置",
    dataIndex: "ossConfig",
    width: 100,
    customRender: ({ text }: any) =>
      text ? h("a-tag", { color: "blue" }, "已配置") : h("a-tag", {}, "未配置"),
  },
  {
    title: "状态",
    dataIndex: "isActive",
    width: 100,
    customRender: ({ text }: any) =>
      text === 1
        ? h("a-tag", { color: "green" }, "当前使用")
        : h("a-tag", {}, "未启用"),
  },
  { title: "创建时间", dataIndex: "createdAt", width: 160 },
  {
    title: "操作",
    key: "_action",
    width: 260,
    fixed: "right",
  },
];

function getDefaultWechatConfig(): WechatAppConfig {
  return {
    appId: "",
    secret: "",
    paymentMchId: "",
    paymentKey: "",
    notifyUrl: "",
    refundNotifyUrl: "",
    pfxPath: "",
    offerId: "",
    appKey: "",
    sandboxAppKey: "",
    env: 1,
  };
}

function getDefaultOssConfig(): OssConfig {
  return {
    region: "",
    accessKeyId: "",
    accessKeySecret: "",
    bucket: "",
  };
}

const formData = ref<{
  name: string;
  isActive: number;
  remark: string;
  wechatConfig: WechatAppConfig;
  ossConfig: OssConfig;
}>({
  name: "",
  isActive: 0,
  remark: "",
  wechatConfig: getDefaultWechatConfig(),
  ossConfig: getDefaultOssConfig(),
});

function handleAdd() {
  editingRecord.value = null;
  formData.value = {
    name: "",
    isActive: 0,
    remark: "",
    wechatConfig: getDefaultWechatConfig(),
    ossConfig: getDefaultOssConfig(),
  };
  modalVisible.value = true;
}

function handleEdit(record: GlobalConfigRecord) {
  editingRecord.value = record;
  formData.value = {
    name: record.name,
    isActive: record.isActive,
    remark: record.remark || "",
    wechatConfig: record.wechatConfig || getDefaultWechatConfig(),
    ossConfig: record.ossConfig || getDefaultOssConfig(),
  };
  modalVisible.value = true;
}

async function loadData() {
  loading.value = true;
  try {
    dataList.value = (await globalConfigApi.getList()) as any;
  } catch {
    dataList.value = [];
  } finally {
    loading.value = false;
  }
}

async function handleSubmit() {
  if (!formData.value.name) {
    message.warning("请填写配置名称");
    return;
  }
  submitting.value = true;
  try {
    const wc = formData.value.wechatConfig;
    const oss = formData.value.ossConfig;
    const payload = {
      name: formData.value.name,
      isActive: !!formData.value.isActive,
      wechatConfig: wc.appId ? wc : null,
      ossConfig: oss.accessKeyId ? oss : null,
      remark: formData.value.remark,
    };
    if (editingRecord.value) {
      await globalConfigApi.update(editingRecord.value.id, payload as any);
      message.success("更新成功");
    } else {
      await globalConfigApi.create(payload as any);
      message.success("创建成功");
    }
    modalVisible.value = false;
    loadData();
  } catch {
    /* 全局通知处理 */
  } finally {
    submitting.value = false;
  }
}

async function handleDelete(record: GlobalConfigRecord) {
  Modal.confirm({
    title: "确认删除",
    content: `确定删除 "${record.name}" 吗？`,
    okType: "danger",
    async onOk() {
      try {
        await globalConfigApi.remove(record.id);
        message.success("删除成功");
        loadData();
      } catch {}
    },
  });
}

async function handleSetActive(record: GlobalConfigRecord) {
  try {
    await globalConfigApi.setActive(record.id);
    message.success("已设为当前使用");
    loadData();
  } catch {}
}

loadData();
</script>

<template>
  <div>
    <div class="config-toolbar">
      <a-button @click="loadData"><ReloadOutlined /> 刷新</a-button>
      <a-space>
        <a-button type="primary" @click="handleAdd"
          ><PlusOutlined /> 新增配置</a-button
        >
      </a-space>
    </div>
    <a-table
      :columns="columns"
      :data-source="dataList"
      row-key="id"
      :loading="loading"
      :pagination="false"
      size="middle"
      bordered
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === '_action'">
          <a-space>
            <a-button size="small" @click="handleEdit(record)"
              ><EditOutlined /> 编辑</a-button
            >
            <a-button
              v-if="record.isActive !== 1"
              size="small"
              type="primary"
              ghost
              @click="handleSetActive(record)"
              ><CheckCircleOutlined /> 启用</a-button
            >
            <a-popconfirm title="确定删除？" @confirm="handleDelete(record)"
              ><a-button size="small" danger>删除</a-button></a-popconfirm
            >
          </a-space>
        </template>
      </template>
    </a-table>

    <a-modal
      v-model:open="modalVisible"
      :title="editingRecord ? '编辑全局配置' : '新增全局配置'"
      :width="900"
      :confirm-loading="submitting"
      @ok="handleSubmit"
    >
      <a-form layout="vertical">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="配置名称">
              <a-input
                v-model:value="formData.name"
                placeholder="如：生产环境"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="备注">
              <a-input v-model:value="formData.remark" placeholder="备注说明" />
            </a-form-item>
          </a-col>
        </a-row>

        <a-tabs>
          <!-- 微信支付 Tab -->
          <a-tab-pane key="pay" tab="微信支付">
            <a-row :gutter="16">
              <a-col :span="12">
                <a-form-item label="AppID">
                  <a-input
                    v-model:value="formData.wechatConfig.appId"
                    placeholder="小程序AppID"
                  />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="Secret">
                  <a-input
                    v-model:value="formData.wechatConfig.secret"
                    placeholder="小程序Secret"
                  />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="商户号">
                  <a-input
                    v-model:value="formData.wechatConfig.paymentMchId"
                    placeholder="商户号MchID"
                  />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="支付密钥">
                  <a-input
                    v-model:value="formData.wechatConfig.paymentKey"
                    placeholder="商户支付密钥"
                  />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="证书路径">
                  <a-input
                    v-model:value="formData.wechatConfig.pfxPath"
                    placeholder="pfx证书路径"
                  />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="回调URL">
                  <a-input
                    v-model:value="formData.wechatConfig.notifyUrl"
                    placeholder="支付回调URL"
                  />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="退款回调URL">
                  <a-input
                    v-model:value="formData.wechatConfig.refundNotifyUrl"
                    placeholder="退款回调URL"
                  />
                </a-form-item>
              </a-col>
            </a-row>
          </a-tab-pane>

          <!-- 虚拟支付 Tab -->
          <a-tab-pane key="virtual-pay" tab="虚拟支付">
            <a-row :gutter="16">
              <a-col :span="12">
                <a-form-item label="OfferID">
                  <a-input
                    v-model:value="formData.wechatConfig.offerId"
                    placeholder="MP后台 → 虚拟支付 → 基础配置 → OfferID"
                  />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="环境">
                  <a-select
                    v-model:value="formData.wechatConfig.env"
                    :options="[
                      { value: 1, label: '沙箱环境' },
                      { value: 0, label: '现网环境' },
                    ]"
                  />
                </a-form-item>
              </a-col>
              <a-col :span="24">
                <a-form-item label="现网 AppKey">
                  <a-input
                    v-model:value="formData.wechatConfig.appKey"
                    placeholder="现网 AppKey"
                  />
                </a-form-item>
              </a-col>
              <a-col :span="24">
                <a-form-item label="沙箱 AppKey">
                  <a-input
                    v-model:value="formData.wechatConfig.sandboxAppKey"
                    placeholder="沙箱 AppKey"
                  />
                </a-form-item>
              </a-col>
            </a-row>
          </a-tab-pane>

          <!-- OSS Tab -->
          <a-tab-pane key="oss" tab="OSS 配置">
            <a-row :gutter="16">
              <a-col :span="12">
                <a-form-item label="Region">
                  <a-input
                    v-model:value="formData.ossConfig.region"
                    placeholder="如：oss-cn-beijing"
                  />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="Bucket">
                  <a-input
                    v-model:value="formData.ossConfig.bucket"
                    placeholder="Bucket名称"
                  />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="AccessKey ID">
                  <a-input
                    v-model:value="formData.ossConfig.accessKeyId"
                    placeholder="AccessKey ID"
                  />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="AccessKey Secret">
                  <a-input
                    v-model:value="formData.ossConfig.accessKeySecret"
                    placeholder="AccessKey Secret"
                  />
                </a-form-item>
              </a-col>
            </a-row>
          </a-tab-pane>
        </a-tabs>
      </a-form>
    </a-modal>
  </div>
</template>

<style scoped lang="less">
.config-toolbar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}
</style>
