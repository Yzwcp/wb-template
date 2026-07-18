import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
} from 'sequelize-typescript';

/** 系统权限表 */
@Table({
  tableName: 'sys_permission',
  timestamps: true,
  underscored: true,
  comment: '系统权限表',
})
export default class Permission extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number;

  @Column({
    type: DataType.STRING(64),
    allowNull: false,
    comment: '权限名称',
  })
  name!: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: false,
    unique: true,
    comment: '权限编码',
  })
  code!: string;

  @Column({
    type: DataType.STRING(256),
    allowNull: true,
    comment: '权限描述',
  })
  description!: string;

  @Column(DataType.DATE)
  createdAt!: Date;
}
