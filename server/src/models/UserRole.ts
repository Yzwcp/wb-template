import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import User from './User';
import Role from './Role';

/** 用户角色关联表 */
@Table({
  tableName: 'sys_user_role',
  timestamps: false,
  underscored: true,
  comment: '用户角色关联表',
})
export default class UserRole extends Model {
  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    primaryKey: true,
    comment: '用户ID',
  })
  userId!: number;

  @ForeignKey(() => Role)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    primaryKey: true,
    comment: '角色ID',
  })
  roleId!: number;

  /** 关联用户 */
  @BelongsTo(() => User)
  user!: User;

  /** 关联角色 */
  @BelongsTo(() => Role)
  role!: Role;
}
