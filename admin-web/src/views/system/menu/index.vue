<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue'
import { message, Modal } from 'ant-design-vue'
import { PlusOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons-vue'
import * as menuApi from '@/api/menu'
import SForm from '@/components/SForm/index.vue'
import type { FormField, TreeNode } from '@/types'

defineOptions({ name: 'SystemMenu' })

const treeData = ref<any[]>([])
const selectedMenu = ref<any>(null)
const isEditing = ref(false)
const formRef = ref<InstanceType<typeof SForm> | null>(null)
const formModel = ref<Record<string, any>>({})
const searchValue = ref('')
const treeLoading = ref(false)

const menuTypeOptions = [
  { label: '目录', value: 'M' },
  { label: '菜单', value: 'C' },
  { label: '按钮', value: 'F' },
]

const parentTreeData = computed<TreeNode[]>(() => {
  const convert = (data: any[]): TreeNode[] => {
    return (data || []).map((item: any) => ({
      id: item.id,
      label: item.name,
      value: item.id,
      children: item.children ? convert(item.children) : undefined,
    }))
  }
  return convert(treeData.value)
})

const fields = computed<FormField[]>(() => [
  {
    label: '上级菜单',
    name: 'parentId',
    type: 'treeSelect',
    span: 24,
    placeholder: '不选则为根菜单',
    treeData: parentTreeData.value,
    props: { allowClear: true },
  },
  { label: '菜单名称', name: 'name', type: 'input', required: true, span: 12 },
  {
    label: '菜单类型',
    name: 'type',
    type: 'radio',
    required: true,
    span: 24,
    options: menuTypeOptions,
  },
  {
    label: '路由地址',
    name: 'path',
    type: 'input',
    span: 12,
    hidden: (m) => m.type === 'F',
  },
  {
    label: '组件路径',
    name: 'component',
    type: 'input',
    span: 12,
    hidden: (m) => m.type !== 'C',
  },
  { label: '图标', name: 'icon', type: 'input', span: 12, placeholder: '如：SettingOutlined' },
  { label: '权限标识', name: 'permission', type: 'input', span: 12 },
  { label: '排序', name: 'sort', type: 'inputNumber', span: 6, min: 0 },
  { label: '显示', name: 'visible', type: 'switch', span: 6, props: { checkedValue: true, unCheckedValue: false } },
  { label: '状态', name: 'status', type: 'switch', span: 6, props: { checkedValue: 1, unCheckedValue: 0 } },
])

async function loadTree() {
  treeLoading.value = true
  try {
    const data = await menuApi.getTree()
    treeData.value = formatTreeData(data || [])
  } catch {
  } finally {
    treeLoading.value = false
  }
}

function formatTreeData(data: any[]): any[] {
  return data.map((item) => ({
    key: item.id,
    title: item.name,
    id: item.id,
    parentId: item.parentId,
    name: item.name,
    type: item.type,
    path: item.path,
    component: item.component,
    icon: item.icon,
    permission: item.permission,
    sort: item.sort,
    visible: item.visible !== undefined ? item.visible : true,
    status: item.status !== undefined ? item.status : 1,
    children: item.children ? formatTreeData(item.children) : undefined,
  }))
}

function handleTreeSelect(selectedKeys: any[], info: any) {
  const node = info?.node
  if (node) {
    selectedMenu.value = node
    formModel.value = {
      parentId: node.parentId,
      name: node.name || node.title,
      type: node.type,
      path: node.path || '',
      component: node.component || '',
      icon: node.icon || '',
      permission: node.permission || '',
      sort: node.sort ?? 0,
      visible: node.visible !== undefined ? node.visible : true,
      status: node.status !== undefined ? node.status : 1,
    }
    isEditing.value = true
  }
}

function handleAddRoot() {
  selectedMenu.value = null
  formModel.value = {
    parentId: undefined,
    name: '',
    type: 'M',
    path: '',
    component: '',
    icon: '',
    permission: '',
    sort: 0,
    visible: true,
    status: 1,
  }
  isEditing.value = true
  nextTick(() => formRef.value?.resetFields())
}

function handleAddChild() {
  if (!selectedMenu.value) {
    message.warning('请先选择父菜单')
    return
  }
  if (selectedMenu.value.type === 'F') {
    message.warning('按钮类型不能添加子菜单')
    return
  }
  formModel.value = {
    parentId: selectedMenu.value.id,
    name: '',
    type: 'M',
    path: '',
    component: '',
    icon: '',
    permission: '',
    sort: 0,
    visible: true,
    status: 1,
  }
  isEditing.value = true
  nextTick(() => formRef.value?.resetFields())
}

async function handleDelete() {
  if (!selectedMenu.value) {
    message.warning('请先选择要删除的菜单')
    return
  }
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除菜单 "${selectedMenu.value.name}" 吗？${selectedMenu.value.children?.length ? '其子菜单也将被删除。' : ''}`,
    okText: '确定',
    cancelText: '取消',
    async onOk() {
      try {
        await menuApi.remove(selectedMenu.value.id)
        message.success('删除成功')
        selectedMenu.value = null
        isEditing.value = false
        loadTree()
      } catch (err: any) {
      }
    },
  })
}

async function handleSave() {
  if (!formRef.value) return
  const valid = await formRef.value.validate()
  if (!valid) return

  const values = formRef.value.getValues()
  try {
    if (selectedMenu.value && selectedMenu.value.id) {
      await menuApi.update(selectedMenu.value.id, values)
      message.success('更新成功')
    } else {
      await menuApi.create(values)
      message.success('创建成功')
    }
    isEditing.value = false
    selectedMenu.value = null
    loadTree()
  } catch (err: any) {
  }
}

function handleCancel() {
  isEditing.value = false
  if (!selectedMenu.value?.id) {
    selectedMenu.value = null
  } else {
    formModel.value = { ...selectedMenu.value }
  }
}

function filterTree(data: any[], search: string): any[] {
  if (!search) return data
  return data
    .map((item) => {
      const children = item.children ? filterTree(item.children, search) : undefined
      if (item.title?.includes(search) || children?.length) {
        return { ...item, children }
      }
      return null
    })
    .filter(Boolean)
}

const filteredTreeData = computed(() => filterTree(treeData.value, searchValue.value))

function handleSearch() {
  // computed will auto update
}

// Watch searchValue to expand matching nodes
watch(searchValue, () => {
  // tree will re-render with filtered data
})

loadTree()
</script>

<template>
  <div class="system-menu">
    <a-card title="菜单管理" :bordered="false">
      <a-row :gutter="16">
        <!-- Left: Tree -->
        <a-col :span="8">
          <div class="menu-tree-panel">
            <div class="tree-toolbar">
              <a-space>
                <a-button type="primary" size="small" @click="handleAddRoot">
                  <PlusOutlined /> 根菜单
                </a-button>
                <a-button size="small" @click="handleAddChild">
                  <PlusOutlined /> 子菜单
                </a-button>
                <a-button danger size="small" @click="handleDelete">
                  <DeleteOutlined /> 删除
                </a-button>
              </a-space>
            </div>
            <div class="tree-search">
              <a-input
                v-model:value="searchValue"
                placeholder="搜索菜单"
                allow-clear
                @change="handleSearch"
              >
                <template #prefix><SearchOutlined /></template>
              </a-input>
            </div>
            <a-spin :spinning="treeLoading">
              <a-tree
                :tree-data="filteredTreeData"
                :default-expand-all="true"
                show-line
                block-node
                :selected-keys="selectedMenu ? [selectedMenu.id || selectedMenu.key] : []"
                @select="handleTreeSelect"
              >
                <template #title="{ title, type }">
                  <span>
                    <a-tag v-if="type === 'M'" color="blue" style="margin-right: 4px">目录</a-tag>
                    <a-tag v-else-if="type === 'C'" color="green" style="margin-right: 4px">菜单</a-tag>
                    <a-tag v-else-if="type === 'F'" color="orange" style="margin-right: 4px">按钮</a-tag>
                    {{ title }}
                  </span>
                </template>
              </a-tree>
            </a-spin>
          </div>
        </a-col>

        <!-- Right: Form -->
        <a-col :span="16">
          <div class="menu-form-panel">
            <template v-if="isEditing">
              <div class="form-header">
                <span class="form-title">{{ selectedMenu?.id ? '编辑菜单' : '新增菜单' }}</span>
              </div>
              <SForm ref="formRef" :fields="fields" :model="formModel" :cols="2" />
              <div class="form-actions">
                <a-button type="primary" @click="handleSave">保存</a-button>
                <a-button style="margin-left: 8px" @click="handleCancel">取消</a-button>
              </div>
            </template>
            <template v-else>
              <div class="empty-state">
                <a-empty description="请在左侧选择或新增菜单" />
              </div>
            </template>
          </div>
        </a-col>
      </a-row>
    </a-card>
  </div>
</template>

<style scoped lang="less">
.system-menu {
  .menu-tree-panel {
    border: 1px solid #f0f0f0;
    border-radius: 4px;
    padding: 12px;
    min-height: 500px;

    .tree-toolbar {
      margin-bottom: 12px;
    }

    .tree-search {
      margin-bottom: 12px;
    }
  }

  .menu-form-panel {
    border: 1px solid #f0f0f0;
    border-radius: 4px;
    padding: 16px;
    min-height: 500px;

    .form-header {
      margin-bottom: 16px;
      .form-title {
        font-size: 16px;
        font-weight: 600;
      }
    }

    .form-actions {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid #f0f0f0;
    }

    .empty-state {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 400px;
    }
  }
}
</style>
