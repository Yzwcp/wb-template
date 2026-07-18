import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import DictType from './DictType';

/** 字典数据表 */
@Table({
  tableName: 'sys_dict_data',
  timestamps: true,
  underscored: true,
  comment: '字典数据表',
})
export default class DictData extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number;

  @ForeignKey(() => DictType)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: '字典类型ID',
  })
  typeId!: number;

  @Column({
    type: DataType.STRING(128),
    allowNull: false,
    comment: '字典标签',
  })
  label!: string;

  @Column({
    type: DataType.STRING(128),
    allowNull: false,
    comment: '字典值',
  })
  value!: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '排序',
  })
  sort!: number;

  @Column({
    type: DataType.STRING(500),
    allowNull: true,
    comment: '扩展元数据(JSON)',
  })
  remark?: string;

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

  /** 所属字典类型 */
  @BelongsTo(() => DictType)
  dictType!: DictType;
}
