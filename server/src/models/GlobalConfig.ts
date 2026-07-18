import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
} from "sequelize-typescript";

/** 全局配置表（单行记录，各配置以JSON存储） */
@Table({
  tableName: "sys_global_config",
  timestamps: true,
  underscored: true,
  comment: "全局配置表",
})
export default class GlobalConfig extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    comment: "配置名称",
  })
  name!: string;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: "是否启用（0-否，1-是，同时只能启用一个）",
  })
  isActive!: number;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: "微信小程序配置（JSON）",
    get() {
      const raw = this.getDataValue("wechatConfig" as any);
      return raw ? JSON.parse(raw as unknown as string) : null;
    },
    set(value: any) {
      this.setDataValue(
        "wechatConfig" as any,
        value ? JSON.stringify(value) : null,
      );
    },
  })
  wechatConfig!: WechatAppConfig | null;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: "OSS配置（JSON）",
    get() {
      const raw = this.getDataValue("ossConfig" as any);
      return raw ? JSON.parse(raw as unknown as string) : null;
    },
    set(value: any) {
      this.setDataValue(
        "ossConfig" as any,
        value ? JSON.stringify(value) : null,
      );
    },
  })
  ossConfig!: OssConfig | null;

  @Column({
    type: DataType.STRING(500),
    allowNull: true,
    comment: "备注",
  })
  remark?: string;

  @Column(DataType.DATE)
  createdAt!: Date;

  @Column(DataType.DATE)
  updatedAt!: Date;
}

/** 微信小程序配置 */
export interface WechatAppConfig {
  appId: string;
  secret: string;
  paymentMchId: string;
  paymentKey: string;
  notifyUrl?: string;
  refundNotifyUrl?: string;
  pfxPath?: string;
  /** 虚拟支付 OfferID */
  offerId?: string;
  /** 虚拟支付 现网 AppKey */
  appKey?: string;
  /** 虚拟支付 沙箱 AppKey */
  sandboxAppKey?: string;
  /** 虚拟支付环境：1-沙箱，0-现网 */
  env?: number;
}

/** OSS 配置 */
export interface OssConfig {
  region: string;
  accessKeyId: string;
  accessKeySecret: string;
  bucket: string;
}
