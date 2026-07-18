<script setup lang="ts">
import { ref, onMounted, h, computed } from 'vue'
import { message, Popconfirm } from 'ant-design-vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import STable from '@/components/STable/index.vue'
import type { Column, SearchField } from '@/types'
import * as roleApi from '@/api/role'
import * as menuApi from '@/api/menu'
import dayjs from 'dayjs'
import RoleFormModal from './components/RoleFormModal.vue'
import { useDict } from '@/composables/useDict'

defineOptions({ name: 'SystemRole' })

const { loadDict, getLabel, getOptions } = useDict();

const tableRef = ref<InstanceType<typeof STable> | null>(null)
const modalVisible = ref(false)
const editingRecord = ref<any>(null)
const modalTitle = ref('新增角色')

// Menu assignment dialog
const menuDialogVisible = ref(false)
const menuTreeData = ref<any[]>([])
const checkedMenuKeys = ref<number[]>([])
const currentRoleId = ref<number>(0)
const menuLoading = ref(false)

const columns: Column[] = [
  { title: '角色名称', dataIndex: 'name', width: 150 },
  { title: '角色编码', dataIndex: 'code', width: 150 },
  { title: '描述', dataIndex: 'description', width: 200, ellipsis: true },
  {
    title: '状态',
    dataIndex: 'status',
    width: 80,
    customRender: ({ text }) => {
      return h('a-tag', { color: text === 1 ? 'green' : 'red' }, getLabel('SYS_ENABLE', text))
    },
  },
  {
    title: '创建时间',
    dataIndex: 'createdAt',
    width: 170,
    customRender: ({ text }) => (text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : '-'),
  },
  { title: '操作', dataIndex: '_action', key: '_action', width: 260, fixed: 'right' },
]

const searchFields = computed<SearchField[]>(() => [
  { label: '角色名称', name: 'name', type: 'input' },
  {
    label: '状态',
    name: 'status',
    type: 'select',
    options: getOptions('SYS_ENABLE'),
  },
])

function handleAdd() {
  editingRecord.value = null
  modalTitle.value = '新增角色'
  modalVisible.value = true
}

function handleEdit(record: any) {
  editingRecord.value = { ...record }
  modalTitle.value = '编辑角色'
  modalVisible.value = true
}

async function handleDelete(record: any) {
  try {
    await roleApi.remove(record.id)
    message.success('删除成功')
    tableRef.value?.refresh()
  } catch (err: any) {
  }
}

function handleModalSuccess() {
  modalVisible.value = false
  tableRef.value?.refresh()
}

// Menu assignment
async function handleAssignMenus(record: any) {
  currentRoleId.value = record.id
  menuLoading.value = true
  try {
    const [tree, roleDetail] = await Promise.all([
      menuApi.getTree(),
      roleApi.getById(record.id),
    ])
    menuTreeData.value = formatTree(tree || [])
    // 后端返回 menus: [{id:1},...]，提取 id 数组
    const rawMenus = roleDetail?.menus || roleDetail?.menuIds || []
    checkedMenuKeys.value = rawMenus.map((m: any) => m.id ?? m)
    menuDialogVisible.value = true
  } catch (err: any) {
  } finally {
    menuLoading.value = false
  }
}

function formatTree(data: any[]): any[] {
  return data.map((item) => ({
    key: item.id,
    title: item.name,
    children: item.children ? formatTree(item.children) : undefined,
  }))
}

async function handleSaveMenus() {
  try {
    const halfCheckedKeys = menuDialogRef.value?.halfCheckedKeys || []
    const allKeys = [...checkedMenuKeys.value, ...halfCheckedKeys]
    await roleApi.assignMenus(currentRoleId.value, allKeys)
    message.success('菜单分配成功')
    menuDialogVisible.value = false
  } catch (err: any) {
  }
}

const menuDialogRef = ref<any>(null)

function handleMenuCheck(checkedKeys: any) {
  checkedMenuKeys.value = checkedKeys.checked || checkedKeys
}

onMounted(async () => {
  await loadDict('SYS_ENABLE')
})
</script>

<template>
  <div class="system-role">
    <STable
      ref="tableRef"
      title="角色管理"
      :columns="columns"
      :api="roleApi.getList"
      :search-fields="searchFields"
      :show-index="true"
    >
      <template #toolbar>
        <a-button type="primary" @click="handleAdd">
          <PlusOutlined />
          新增角色
        </a-button>
      </template>

      <template #action="{ record }">
        <a-space>
          <a @click="handleEdit(record)">编辑</a>
          <a @click="handleAssignMenus(record)">分配菜单</a>
          <Popconfirm
            title="确定要删除该角色吗？"
            ok-text="确定"
            cancel-text="取消"
            @confirm="handleDelete(record)"
          >
            <a style="color: #ff4d4f">删除</a>
          </Popconfirm>
        </a-space>
      </template>
    </STable>

    <RoleFormModal
      v-model:visible="modalVisible"
      :title="modalTitle"
      :record="editingRecord"
      @success="handleModalSuccess"
    />

    <!-- Menu assignment dialog -->
    <a-modal
      v-model:open="menuDialogVisible"
      title="分配菜单"
      width="500"
      @ok="handleSaveMenus"
    >
      <a-spin :spinning="menuLoading">
        <div style="max-height: 400px; overflow-y: auto;">
          <a-tree
            ref="menuDialogRef"
            v-model:checkedKeys="checkedMenuKeys"
            checkable
            :tree-data="menuTreeData"
            :default-expand-all="true"
            @check="handleMenuCheck"
          />
        </div>
      </a-spin>
    </a-modal>
  </div>
</template>
