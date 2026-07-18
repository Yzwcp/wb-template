import Menu from '../models/Menu';
import RoleMenu from '../models/RoleMenu';
import { BusinessError } from '../utils/response';
import { Op } from 'sequelize';

interface MenuTreeNode {
  id: number;
  parentId: number;
  name: string;
  type: string;
  path: string;
  component: string;
  icon: string;
  permission: string;
  sort: number;
  visible: number;
  status: number;
  children: MenuTreeNode[];
}

class MenuService {
  /** 获取菜单树 */
  async getTree() {
    const menus = await Menu.findAll({
      order: [['sort', 'ASC']],
    });

    return this.buildTree(menus.map(m => m.toJSON()));
  }

  /** 根据ID获取菜单 */
  async getById(id: number) {
    const menu = await Menu.findByPk(id);
    if (!menu) {
      throw new BusinessError(400, '菜单不存在');
    }
    return menu;
  }

  /** 创建菜单 */
  async create(data: {
    parentId?: number;
    name: string;
    type: string;
    path?: string;
    component?: string;
    icon?: string;
    permission?: string;
    sort?: number;
    visible?: number;
    status?: number;
  }) {
    const menu = await Menu.create({
      parentId: data.parentId ?? 0,
      name: data.name,
      type: data.type,
      path: data.path || '',
      component: data.component || '',
      icon: data.icon || '',
      permission: data.permission || '',
      sort: data.sort ?? 0,
      visible: data.visible ?? 1,
      status: data.status ?? 1,
    });

    return menu;
  }

  /** 更新菜单 */
  async update(id: number, data: {
    parentId?: number;
    name?: string;
    type?: string;
    path?: string;
    component?: string;
    icon?: string;
    permission?: string;
    sort?: number;
    visible?: number;
    status?: number;
  }) {
    const menu = await Menu.findByPk(id);
    if (!menu) {
      throw new BusinessError(400, '菜单不存在');
    }

    await menu.update(data);
    return menu;
  }

  /** 删除菜单（有子菜单时不允许删除） */
  async remove(id: number) {
    const menu = await Menu.findByPk(id);
    if (!menu) {
      throw new BusinessError(400, '菜单不存在');
    }

    // 检查是否有子菜单
    const children = await Menu.findAll({ where: { parentId: id } });
    if (children.length > 0) {
      throw new BusinessError(400, '存在子菜单，无法删除');
    }

    // 删除角色菜单关联
    await RoleMenu.destroy({ where: { menuId: id } });

    // 删除菜单
    await menu.destroy();
  }

  /** 构建菜单树 */
  private buildTree(menus: any[]): MenuTreeNode[] {
    const buildChildren = (parentId: number): MenuTreeNode[] => {
      return menus
        .filter(m => m.parentId === parentId)
        .map(m => ({
          id: m.id,
          parentId: m.parentId,
          name: m.name,
          type: m.type,
          path: m.path || '',
          component: m.component || '',
          icon: m.icon || '',
          permission: m.permission || '',
          sort: m.sort,
          visible: m.visible,
          status: m.status,
          children: buildChildren(m.id),
        }));
    };

    return buildChildren(0);
  }
}

export default new MenuService();
