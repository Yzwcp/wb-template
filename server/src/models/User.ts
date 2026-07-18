import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  BelongsToMany,
} from "sequelize-typescript";
import Role from "./Role";
import UserRole from "./UserRole";

/** 系统用户表 */
@Table({
  tableName: "sys_user",
  timestamps: true,
  underscored: true,
  comment: "系统用户表",
})
export default class User extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number;

  @Column({
    type: DataType.STRING(64),
    allowNull: false,
    comment: "用户名",
  })
  username!: string;

  @Column({
    type: DataType.STRING(128),
    allowNull: false,
    comment: "密码",
  })
  password!: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: "昵称",
  })
  nickname!: string;

  @Column({
    type: DataType.STRING(128),
    allowNull: true,
    comment: "邮箱",
  })
  email!: string;

  @Column({
    type: DataType.STRING(20),
    allowNull: true,
    comment: "手机号",
  })
  phone!: string;

  @Column({
    type: DataType.STRING(256),
    allowNull: true,
    comment: "头像",
  })
  avatar!: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: "微信OpenID",
  })
  openid!: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: "微信UnionID",
  })
  unionid!: string;

  @Column({
    type: DataType.STRING(20),
    allowNull: false,
    defaultValue: "mp-weixin",
    comment: "平台标识: admin/mp-weixin/h5",
  })
  platform!: string;

  @Column({
    type: DataType.STRING(1),
    allowNull: false,
    defaultValue: "1",
    comment: "状态：2-禁用，1-启用",
  })
  status!: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: "最后登录时间",
  })
  lastLoginAt!: Date;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: "最后登录IP",
  })
  lastLoginIp!: string;

  @Column(DataType.DATE)
  createdAt!: Date;

  @Column(DataType.DATE)
  updatedAt!: Date;

  /** 用户与角色的多对多关系 */
  @BelongsToMany(() => Role, () => UserRole)
  roles!: Role[];
}
