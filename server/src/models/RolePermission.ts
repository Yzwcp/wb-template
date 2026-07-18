import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import Role from './Role';
import Permission from './Permission';

/** 角色权限关联表 */
@Table({
  tableName: 'sys_role_permission',
  timestamps: false,
  underscored: true,
  comment: '角色权限关联表',
})
export default class RolePermission extends Model {
  @ForeignKey(() => Role)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    primaryKey: true,
    comment: '角色ID',
  })
  roleId!: number;

  @ForeignKey(() => Permission)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    primaryKey: true,
    comment: '权限ID',
  })
  permissionId!: number;

  @BelongsTo(() => Role)
  role!: Role;

  @BelongsTo(() => Permission)
  permission!: Permission;
}
