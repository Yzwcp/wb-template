import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
} from "sequelize-typescript";

/** 系统文件表 */
@Table({
  tableName: "sys_file",
  timestamps: true,
  underscored: true,
  createdAt: "created_at",
  updatedAt: false,
  comment: "系统文件表",
})
export default class SysFile extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number;

  @Column({
    type: DataType.STRING(256),
    allowNull: false,
    comment: "原始文件名",
  })
  originalName!: string;

  @Column({
    type: DataType.STRING(512),
    allowNull: false,
    comment: "存储路径",
  })
  storagePath!: string;

  @Column({
    type: DataType.STRING(512),
    allowNull: false,
    comment: "访问URL",
  })
  url!: string;

  @Column({
    type: DataType.STRING(128),
    allowNull: true,
    comment: "MIME类型",
  })
  mimeType!: string;

  @Column({
    type: DataType.BIGINT,
    allowNull: false,
    comment: "文件大小（字节）",
  })
  size!: number;

  @Column({
    type: DataType.STRING(32),
    allowNull: true,
    comment: "存储类型：local/oss/cos",
  })
  storageType!: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: '上传者ID',
  })
  uploadBy!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: '分组ID',
  })
  groupId!: number;

  @Column(DataType.DATE)
  createdAt!: Date;
}
