import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import Role from './Role';
import Menu from './Menu';

/** 角色菜单关联表 */
@Table({
  tableName: 'sys_role_menu',
  timestamps: false,
  underscored: true,
  comment: '角色菜单关联表',
})
export default class RoleMenu extends Model {
  @ForeignKey(() => Role)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    primaryKey: true,
    comment: '角色ID',
  })
  roleId!: number;

  @ForeignKey(() => Menu)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    primaryKey: true,
    comment: '菜单ID',
  })
  menuId!: number;

  /** 关联角色 */
  @BelongsTo(() => Role)
  role!: Role;

  /** 关联菜单 */
  @BelongsTo(() => Menu)
  menu!: Menu;
}
