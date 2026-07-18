import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  BelongsToMany,
} from 'sequelize-typescript';
import User from './User';
import Menu from './Menu';
import Permission from './Permission';
import UserRole from './UserRole';
import RoleMenu from './RoleMenu';
import RolePermission from './RolePermission';

/** 系统角色表 */
@Table({
  tableName: 'sys_role',
  timestamps: true,
  underscored: true,
  comment: '系统角色表',
})
export default class Role extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number;

  @Column({
    type: DataType.STRING(64),
    allowNull: false,
    unique: true,
    comment: '角色名称',
  })
  name!: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: false,
    unique: true,
    comment: '角色编码',
  })
  code!: string;

  @Column({
    type: DataType.STRING(256),
    allowNull: true,
    comment: '角色描述',
  })
  description!: string;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '状态：0-禁用，1-启用',
  })
  status!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '排序',
  })
  sort!: number;

  @Column(DataType.DATE)
  createdAt!: Date;

  @Column(DataType.DATE)
  updatedAt!: Date;

  /** 角色与用户的多对多关系 */
  @BelongsToMany(() => User, () => UserRole)
  users!: User[];

  /** 角色与菜单的多对多关系 */
  @BelongsToMany(() => Menu, () => RoleMenu)
  menus!: Menu[];

  /** 角色与权限的多对多关系 */
  @BelongsToMany(() => Permission, () => RolePermission)
  permissions!: Permission[];
}
