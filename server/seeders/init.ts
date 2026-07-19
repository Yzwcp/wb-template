import { sequelize } from '../src/config/database';
import { hashPassword } from '../src/utils/password';
import User from '../src/models/User';
import Role from '../src/models/Role';
import Menu from '../src/models/Menu';
import UserRole from '../src/models/UserRole';
import RoleMenu from '../src/models/RoleMenu';
import DictType from '../src/models/DictType';
import DictData from '../src/models/DictData';

async function seed() {
  await sequelize.authenticate();
  console.log('Connected to database');

  // 同步模型
  await sequelize.sync();
  console.log('Tables synced');

  // 1. 创建管理员用户
  const hashedPw = await hashPassword('admin123');
  const [admin] = await User.findOrCreate({
    where: { username: 'admin' },
    defaults: {
      username: 'admin',
      password: hashedPw,
      nickname: '超级管理员',
      email: 'admin@example.com',
      status: 1,
    },
  });
  console.log('Admin user:', admin.username, '(id:', admin.id, ')');

  // 2. 创建角色
  const [adminRole] = await Role.findOrCreate({
    where: { code: 'admin' },
    defaults: { name: '超级管理员', code: 'admin', description: '拥有全部权限', sort: 0, status: 1 },
  });
  const [operatorRole] = await Role.findOrCreate({
    where: { code: 'operator' },
    defaults: { name: '运营人员', code: 'operator', description: '内容管理和用户管理', sort: 1, status: 1 },
  });
  const [viewerRole] = await Role.findOrCreate({
    where: { code: 'viewer' },
    defaults: { name: '只读用户', code: 'viewer', description: '仅查看权限', sort: 2, status: 1 },
  });
  console.log('Roles created: admin, operator, viewer');

  // 3. 分配管理员角色给 admin 用户
  await UserRole.findOrCreate({ where: { userId: admin.id, roleId: adminRole.id } });
  console.log('Admin role assigned to admin user');

  // 4. 创建菜单树
  const menuTree: Array<{
    name: string; type: string; path: string; component: string; icon: string; permission: string; sort: number; children?: any[];
  }> = [
    {
      name: '系统管理', type: 'M', path: '/system', component: '', icon: 'SettingOutlined', permission: '', sort: 1, children: [
        {
          name: '用户管理', type: 'C', path: '/system/user', component: '/system/user', icon: 'UserOutlined', permission: '', sort: 1, children: [
            { name: '查询用户', type: 'F', path: '', component: '', icon: '', permission: 'sys:user:list', sort: 1 },
            { name: '新增用户', type: 'F', path: '', component: '', icon: '', permission: 'sys:user:add', sort: 2 },
            { name: '编辑用户', type: 'F', path: '', component: '', icon: '', permission: 'sys:user:update', sort: 3 },
            { name: '删除用户', type: 'F', path: '', component: '', icon: '', permission: 'sys:user:delete', sort: 4 },
            { name: '导入用户', type: 'F', path: '', component: '', icon: '', permission: 'sys:user:import', sort: 5 },
            { name: '导出用户', type: 'F', path: '', component: '', icon: '', permission: 'sys:user:export', sort: 6 },
            { name: '分配角色', type: 'F', path: '', component: '', icon: '', permission: 'sys:user:role', sort: 7 },
          ],
        },
        {
          name: '角色管理', type: 'C', path: '/system/role', component: '/system/role', icon: 'TeamOutlined', permission: '', sort: 2, children: [
            { name: '查询角色', type: 'F', path: '', component: '', icon: '', permission: 'sys:role:list', sort: 1 },
            { name: '新增角色', type: 'F', path: '', component: '', icon: '', permission: 'sys:role:add', sort: 2 },
            { name: '编辑角色', type: 'F', path: '', component: '', icon: '', permission: 'sys:role:update', sort: 3 },
            { name: '删除角色', type: 'F', path: '', component: '', icon: '', permission: 'sys:role:delete', sort: 4 },
            { name: '分配菜单', type: 'F', path: '', component: '', icon: '', permission: 'sys:role:menu', sort: 5 },
          ],
        },
        {
          name: '菜单管理', type: 'C', path: '/system/menu', component: '/system/menu', icon: 'MenuOutlined', permission: '', sort: 3, children: [
            { name: '查询菜单', type: 'F', path: '', component: '', icon: '', permission: 'sys:menu:list', sort: 1 },
            { name: '新增菜单', type: 'F', path: '', component: '', icon: '', permission: 'sys:menu:add', sort: 2 },
            { name: '编辑菜单', type: 'F', path: '', component: '', icon: '', permission: 'sys:menu:update', sort: 3 },
            { name: '删除菜单', type: 'F', path: '', component: '', icon: '', permission: 'sys:menu:delete', sort: 4 },
          ],
        },
        {
          name: '权限管理', type: 'C', path: '/system/permission', component: '/system/permission', icon: 'SafetyOutlined', permission: '', sort: 4, children: [
            { name: '查询权限', type: 'F', path: '', component: '', icon: '', permission: 'sys:permission:list', sort: 1 },
            { name: '新增权限', type: 'F', path: '', component: '', icon: '', permission: 'sys:permission:add', sort: 2 },
            { name: '编辑权限', type: 'F', path: '', component: '', icon: '', permission: 'sys:permission:update', sort: 3 },
            { name: '删除权限', type: 'F', path: '', component: '', icon: '', permission: 'sys:permission:delete', sort: 4 },
          ],
        },
        {
          name: '字典管理', type: 'C', path: '/system/dict', component: '/system/dict', icon: 'BookOutlined', permission: '', sort: 5, children: [
            { name: '查询字典', type: 'F', path: '', component: '', icon: '', permission: 'sys:dict:list', sort: 1 },
            { name: '新增字典', type: 'F', path: '', component: '', icon: '', permission: 'sys:dict:add', sort: 2 },
            { name: '编辑字典', type: 'F', path: '', component: '', icon: '', permission: 'sys:dict:update', sort: 3 },
            { name: '删除字典', type: 'F', path: '', component: '', icon: '', permission: 'sys:dict:delete', sort: 4 },
          ],
        },
        {
          name: '缓存管理', type: 'C', path: '/system/cache', component: '/system/cache', icon: 'DatabaseOutlined', permission: '', sort: 6, children: [
            { name: '查询缓存', type: 'F', path: '', component: '', icon: '', permission: 'sys:cache:list', sort: 1 },
            { name: '查询详情', type: 'F', path: '', component: '', icon: '', permission: 'sys:cache:query', sort: 2 },
            { name: '删除缓存', type: 'F', path: '', component: '', icon: '', permission: 'sys:cache:delete', sort: 3 },
          ],
        },
        {
          name: '文件管理', type: 'C', path: '/system/file', component: '/system/file', icon: 'FileOutlined', permission: '', sort: 7, children: [
            { name: '查询文件', type: 'F', path: '', component: '', icon: '', permission: 'sys:file:list', sort: 1 },
            { name: '上传文件', type: 'F', path: '', component: '', icon: '', permission: 'sys:file:upload', sort: 2 },
            { name: '下载文件', type: 'F', path: '', component: '', icon: '', permission: 'sys:file:download', sort: 3 },
            { name: '删除文件', type: 'F', path: '', component: '', icon: '', permission: 'sys:file:delete', sort: 4 },
            { name: '更新文件', type: 'F', path: '', component: '', icon: '', permission: 'sys:file:update', sort: 5 },
          ],
        },
        {
          name: '定时任务', type: 'C', path: '/system/task', component: '/system/task', icon: 'ClockCircleOutlined', permission: '', sort: 8, children: [
            { name: '查询任务', type: 'F', path: '', component: '', icon: '', permission: 'sys:task:list', sort: 1 },
            { name: '新增任务', type: 'F', path: '', component: '', icon: '', permission: 'sys:task:add', sort: 2 },
            { name: '编辑任务', type: 'F', path: '', component: '', icon: '', permission: 'sys:task:update', sort: 3 },
            { name: '删除任务', type: 'F', path: '', component: '', icon: '', permission: 'sys:task:delete', sort: 4 },
            { name: '执行任务', type: 'F', path: '', component: '', icon: '', permission: 'sys:task:execute', sort: 5 },
            { name: '暂停任务', type: 'F', path: '', component: '', icon: '', permission: 'sys:task:pause', sort: 6 },
            { name: '查看日志', type: 'F', path: '', component: '', icon: '', permission: 'sys:task:log', sort: 7 },
          ],
        },
        {
          name: '操作日志', type: 'C', path: '/system/log', component: '/system/log', icon: 'FileTextOutlined', permission: '', sort: 9, children: [
            { name: '查询日志', type: 'F', path: '', component: '', icon: '', permission: 'sys:log:list', sort: 1 },
            { name: '清空日志', type: 'F', path: '', component: '', icon: '', permission: 'sys:log:delete', sort: 2 },
          ],
        },
        {
          name: '消息队列', type: 'C', path: '/system/queue', component: '/system/queue', icon: 'NodeIndexOutlined', permission: '', sort: 10, children: [
            { name: '查询队列', type: 'F', path: '', component: '', icon: '', permission: 'sys:queue:list', sort: 1 },
            { name: '查询任务', type: 'F', path: '', component: '', icon: '', permission: 'sys:queue:query', sort: 2 },
            { name: '重试任务', type: 'F', path: '', component: '', icon: '', permission: 'sys:queue:retry', sort: 3 },
            { name: '清理队列', type: 'F', path: '', component: '', icon: '', permission: 'sys:queue:delete', sort: 4 },
          ],
        },
      ],
    },
  ];

  // 递归创建菜单
  async function createMenuTree(items: any[], parentId: number = 0): Promise<number[]> {
    const ids: number[] = [];
    for (const item of items) {
      const children = item.children || [];
      delete item.children;
      const [menu] = await Menu.findOrCreate({
        where: { name: item.name, parentId },
        defaults: { ...item, parentId, visible: 1, status: 1 },
      });
      ids.push(menu.id);
      if (children.length > 0) {
        await createMenuTree(children, menu.id);
      }
    }
    return ids;
  }

  await createMenuTree(menuTree);
  console.log('Menu tree created');

  // 5. 给 admin 角色分配所有菜单
  const allMenus = await Menu.findAll();
  for (const menu of allMenus) {
    await RoleMenu.findOrCreate({ where: { roleId: adminRole.id, menuId: menu.id } });
  }
  console.log(`All ${allMenus.length} menus assigned to admin role`);

  // 6. 创建订单状态字典
  const [orderStatusType] = await DictType.findOrCreate({
    where: { code: 'order_status' },
    defaults: {
      name: '订单状态',
      code: 'order_status',
      status: 1,
    },
  });
  console.log('Dict type: order_status');

  const orderStatuses = [
    { label: '待支付', value: 'PENDING', sort: 1 },
    { label: '已支付', value: 'PAID', sort: 2 },
    { label: '已关闭', value: 'CLOSED', sort: 3 },
    { label: '退款中', value: 'REFUNDING', sort: 4 },
    { label: '已退款', value: 'REFUNDED', sort: 5 },
    { label: '部分退款', value: 'PARTIAL_REFUND', sort: 6 },
  ];

  for (const item of orderStatuses) {
    await DictData.findOrCreate({
      where: { typeId: orderStatusType.id, value: item.value },
      defaults: {
        typeId: orderStatusType.id,
        label: item.label,
        value: item.value,
        sort: item.sort,
        status: 1,
      },
    });
  }
  console.log('Order status dict data seeded');

  console.log('\n=== Seed complete ===');
  console.log('Login: admin / admin123');
  await sequelize.close();
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
