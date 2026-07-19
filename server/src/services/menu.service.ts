import Menu from '../models/Menu';
import RoleMenu from '../models/RoleMenu';
import { BusinessError } from '../utils/response';
import { Op } from 'sequelize';
import { Cacheable, CacheEvict } from '../cache';

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
  @Cacheable({ key: 'menu:tree', ttl: 600 })
  async getTree() {
    const menus = await Menu.findAll({
      order: [['sort', 'ASC']],
    });

    return this.buildTree(menus.map(m => m.toJSON()));
  }

  /** 根据ID获取菜单 */
  @Cacheable({ key: (id: number) => 'menu:' + id, ttl: 600 })
  async getById(id: number) {
    const menu = await Menu.findByPk(id);
    if (!menu) {
      throw new BusinessError(400, '菜单不存在');
    }
    return menu;
  }

  /** 创建菜单 */
  @CacheEvict({ keys: ['menu:tree'] })
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
  @CacheEvict({ keys: [(id: number) => 'menu:' + id, 'menu:tree'] })
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

  /** 删除菜单（级联删除子菜单及角色关联） */
  @CacheEvict({ keys: [(id: number) => 'menu:' + id, 'menu:tree'] })
  async remove(id: number) {
    const menu = await Menu.findByPk(id);
    if (!menu) {
      throw new BusinessError(400, '菜单不存在');
    }

    // 递归收集所有子孙菜单 ID
    const allIds = await this.collectChildIds(id);
    allIds.push(id);

    // 删除角色-菜单关联
    await RoleMenu.destroy({ where: { menuId: { [Op.in]: allIds } } });
    // 删除所有子菜单
    await Menu.destroy({ where: { id: { [Op.in]: allIds } } });
  }

  /** 递归收集子菜单 ID */
  private async collectChildIds(parentId: number): Promise<number[]> {
    const children = await Menu.findAll({ where: { parentId }, attributes: ['id'] });
    const ids = children.map(c => c.id);
    for (const id of ids) {
      ids.push(...await this.collectChildIds(id));
    }
    return ids;
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
