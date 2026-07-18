import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
} from 'sequelize-typescript';

/** 登录日志表 */
@Table({
  tableName: 'sys_login_log',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: false,
  comment: '登录日志表',
})
export default class LoginLog extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number;

  @Column({
    type: DataType.STRING(64),
    allowNull: false,
    comment: '登录用户名',
  })
  username!: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: '登录IP',
  })
  ip!: string;

  @Column({
    type: DataType.STRING(512),
    allowNull: true,
    comment: 'User-Agent',
  })
  userAgent!: string;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '登录状态：0-失败，1-成功',
  })
  status!: number;

  @Column({
    type: DataType.STRING(256),
    allowNull: true,
    comment: '提示消息',
  })
  message!: string;

  @Column(DataType.DATE)
  createdAt!: Date;
}
