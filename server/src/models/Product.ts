import {
  Table, Column, Model, DataType,
  PrimaryKey, AutoIncrement, BelongsTo, ForeignKey, HasMany,
} from 'sequelize-typescript';
import Order from './Order';

/** 商品表 */
@Table({
  tableName: 'sys_product',
  timestamps: true,
  underscored: true,
  comment: '商品表',
})
export default class Product extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number;

  @Column({ type: DataType.STRING(200), allowNull: false, comment: '商品名称' })
  name!: string;

  @Column({ type: DataType.TEXT, allowNull: true, comment: '商品描述（富文本）' })
  description!: string;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0, comment: '价格（分）' })
  price!: number;

  @Column({ type: DataType.STRING(500), allowNull: true, comment: '封面图URL' })
  coverImage!: string;

  @Column({ type: DataType.TEXT, allowNull: true, comment: '详情图JSON数组' })
  images!: string;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0, comment: '库存' })
  stock!: number;

  @Column({ type: DataType.TINYINT, allowNull: false, defaultValue: 1, comment: '状态 0下架 1上架' })
  status!: number;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0, comment: '排序' })
  sort!: number;

  @Column(DataType.DATE)
  createdAt!: Date;

  @Column(DataType.DATE)
  updatedAt!: Date;

  @HasMany(() => Order)
  orders!: Order[];
}
