import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
} from 'sequelize-typescript';

/** 操作日志表 */
@Table({
  tableName: 'sys_operation_log',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: false,
  comment: '操作日志表',
})
export default class OperationLog extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: '操作用户ID',
  })
  userId!: number;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: '操作用户名',
  })
  username!: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: '操作模块',
  })
  module!: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: '操作动作',
  })
  action!: string;

  @Column({
    type: DataType.STRING(16),
    allowNull: true,
    comment: '请求方法：GET/POST/PUT/DELETE',
  })
  method!: string;

  @Column({
    type: DataType.STRING(256),
    allowNull: true,
    comment: '请求URL',
  })
  url!: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: '请求IP',
  })
  ip!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: '请求参数',
  })
  params!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: '返回结果',
  })
  result!: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: '请求耗时（毫秒）',
  })
  duration!: number;

  @Column(DataType.DATE)
  createdAt!: Date;
}
