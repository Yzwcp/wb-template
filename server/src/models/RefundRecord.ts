import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
} from "sequelize-typescript";
import Order from "./Order";

/** 退款记录表 */
@Table({
  tableName: "sys_refund_record",
  timestamps: true,
  underscored: true,
  comment: "退款记录表",
})
export default class RefundRecord extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number;

  @ForeignKey(() => Order)
  @Column({ type: DataType.INTEGER, allowNull: false, comment: "订单ID" })
  orderId!: number;

  @Column({ type: DataType.STRING(32), allowNull: false, comment: "退款单号" })
  refundNo!: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: "退款金额（分）",
  })
  refundFee!: number;

  @Column({ type: DataType.STRING(100), allowNull: true, comment: "退款原因" })
  refundDesc?: string;

  @Column({
    type: DataType.STRING(20),
    allowNull: false,
    defaultValue: "PROCESSING",
    comment: "状态: PROCESSING/SUCCESS/FAIL",
  })
  status!: string;

  @Column({ type: DataType.STRING(20), allowNull: true, comment: "操作人" })
  operator?: string;

  @Column({ type: DataType.STRING(500), allowNull: true, comment: "错误信息" })
  errorMsg?: string;

  @Column(DataType.DATE)
  createdAt!: Date;

  @Column(DataType.DATE)
  updatedAt!: Date;

  @BelongsTo(() => Order)
  order!: Order;
}
