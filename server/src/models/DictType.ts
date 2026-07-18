import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  HasMany,
} from 'sequelize-typescript';
import DictData from './DictData';

/** 字典类型表 */
@Table({
  tableName: 'sys_dict_type',
  timestamps: true,
  underscored: true,
  comment: '字典类型表',
})
export default class DictType extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number;

  @Column({
    type: DataType.STRING(64),
    allowNull: false,
    comment: '字典名称',
  })
  name!: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: false,
    unique: true,
    comment: '字典编码',
  })
  code!: string;

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

  /** 字典类型下的所有字典数据 */
  @HasMany(() => DictData)
  dictDataList!: DictData[];
}
