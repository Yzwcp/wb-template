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
import User from "./User";
import Product from "./Product";

/** 订单状态枚举 */
export enum OrderStatus {
  PENDING = "PENDING", // 待支付
  PAID = "PAID", // 已支付
  CLOSED = "CLOSED", // 已关闭
  REFUNDING = "REFUNDING", // 退款中
  REFUNDED = "REFUNDED", // 已退款
  PARTIAL_REFUND = "PARTIAL_REFUND", // 部分退款
}

/** 退款状态枚举 */
export enum RefundStatus {
  PROCESSING = "PROCESSING", // 退款处理中
  SUCCESS = "SUCCESS", // 退款成功
  FAIL = "FAIL", // 退款失败
}

/** 订单表 */
@Table({
  tableName: "sys_order",
  timestamps: true,
  underscored: true,
  comment: "订单表",
})
export default class Order extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number;

  @Column({
    type: DataType.STRING(32),
    allowNull: false,
    unique: true,
    comment: "订单号",
  })
  orderNo!: string;

  @Column({
    type: DataType.STRING(32),
    allowNull: false,
    unique: true,
    comment: "商户订单号（微信 out_trade_no）",
  })
  outTradeNo!: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: "微信支付订单号",
  })
  transactionId?: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: "用户ID",
  })
  userId?: number;

  @ForeignKey(() => Product)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: "商品ID",
  })
  productId?: number;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
    comment: "用户 OpenID",
  })
  openid?: string;

  @Column({
    type: DataType.STRING(500),
    allowNull: false,
    comment: "商品描述",
  })
  body!: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: "订单金额（单位：分）",
  })
  totalFee!: number;

  @Column({
    type: DataType.STRING(20),
    allowNull: false,
    defaultValue: OrderStatus.PENDING,
    comment:
      "订单状态：PENDING-待支付, PAID-已支付, CLOSED-已关闭, REFUNDING-退款中, REFUNDED-已退款, PARTIAL_REFUND-部分退款",
  })
  status!: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: "支付时间",
  })
  payTime?: Date;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: "退款金额（单位：分）",
  })
  refundFee!: number;

  @Column({
    type: DataType.STRING(20),
    allowNull: true,
    comment: "退款状态：PROCESSING-退款处理中, SUCCESS-退款成功, FAIL-退款失败",
  })
  refundStatus?: string;

  @Column({
    type: DataType.STRING(32),
    allowNull: true,
    comment: "退款单号",
  })
  refundNo?: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: "预支付ID",
  })
  prepayId?: string;

  @Column(DataType.DATE)
  createdAt!: Date;

  @Column(DataType.DATE)
  updatedAt!: Date;

  /** 所属用户 */
  @BelongsTo(() => User)
  user!: User;

  @BelongsTo(() => Product)
  product!: Product;
}
