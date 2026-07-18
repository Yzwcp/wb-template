import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
} from 'sequelize-typescript';

/** 系统菜单表 */
@Table({
  tableName: 'sys_menu',
  timestamps: true,
  underscored: true,
  comment: '系统菜单表',
})
export default class Menu extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '父菜单ID',
  })
  parentId!: number;

  @Column({
    type: DataType.STRING(64),
    allowNull: false,
    comment: '菜单名称',
  })
  name!: string;

  @Column({
    type: DataType.ENUM('M', 'C', 'F'),
    allowNull: false,
    comment: '菜单类型：M-目录，C-菜单，F-按钮',
  })
  type!: string;

  @Column({
    type: DataType.STRING(256),
    allowNull: true,
    comment: '路由路径',
  })
  path!: string;

  @Column({
    type: DataType.STRING(256),
    allowNull: true,
    comment: '前端组件路径',
  })
  component!: string;

  @Column({
    type: DataType.STRING(128),
    allowNull: true,
    comment: '菜单图标',
  })
  icon!: string;

  @Column({
    type: DataType.STRING(128),
    allowNull: true,
    comment: '权限标识',
  })
  permission!: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '排序',
  })
  sort!: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '是否可见：0-隐藏，1-可见',
  })
  visible!: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '状态：0-禁用，1-启用',
  })
  status!: number;

  @Column(DataType.DATE)
  createdAt!: Date;

  @Column(DataType.DATE)
  updatedAt!: Date;
}
