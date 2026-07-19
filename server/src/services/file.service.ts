import SysFile from "../models/SysFile";
import { config } from "../config/index";
import { BusinessError } from "../utils/response";

class FileService {
  /** 上传文件（本地存储） */
  async upload(file: Express.Multer.File, userId: number) {
    if (!file) {
      throw new BusinessError(400, "请选择文件");
    }

    const fileRecord = await SysFile.create({
      originalName: file.originalname,
      storagePath: file.path,
      url: file.path,
      mimeType: file.mimetype,
      size: file.size,
      storageType: "local",
      uploadBy: userId,
    });

    return fileRecord;
  }

  /** 保存 OSS 上传后的文件记录 */
  async saveOssFile(data: {
    originalName: string;
    url: string;
    mimeType: string;
    size: number;
    uploadBy: number;
    groupId?: number;
  }) {
    const fileRecord = await SysFile.create({
      originalName: data.originalName,
      storagePath: data.url,
      url: data.url,
      mimeType: data.mimeType,
      size: data.size,
      storageType: "oss",
      uploadBy: data.uploadBy,
      groupId: data.groupId || null,
    });
    return fileRecord;
  }

  /** 获取 OSS 直传预签名 URL */
  getUploadUrl(fileName: string, contentType: string) {
    const oss = config.storage.oss;
    if (!oss.accessKeyId || !oss.accessKeySecret || !oss.bucket) {
      throw new BusinessError(400, "OSS 未配置");
    }

    const crypto = require("crypto");

    // 根据文件类型自动分类目录
    let category = "others";
    if (contentType.startsWith("image/")) category = "images";
    else if (contentType.startsWith("video/")) category = "videos";
    else if (contentType.startsWith("audio/")) category = "audios";
    else if (
      contentType.includes("pdf") ||
      contentType.includes("word") ||
      contentType.includes("document") ||
      contentType.includes("excel") ||
      contentType.includes("sheet") ||
      contentType.includes("presentation") ||
      contentType.includes("text")
    )
      category = "documents";

    const dateStr = new Date().toISOString().slice(0, 10);
    const dir = `uploads/${category}/${dateStr}/`;
    const ext = fileName.includes(".")
      ? fileName.substring(fileName.lastIndexOf("."))
      : "";
    const objectKey = `${dir}${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;
    const host = `https://${oss.bucket}.${oss.region}.aliyuncs.com`;
    const fileUrl = `${host}/${objectKey}`;

    // 生成签名 URL（PUT 方式）
    const expires = Math.floor(Date.now() / 1000) + 3600; // 1 小时后过期
    const stringToSign = `PUT\n\n${contentType}\n${expires}\n/${oss.bucket}/${objectKey}`;
    const signature = crypto
      .createHmac("sha1", oss.accessKeySecret)
      .update(stringToSign)
      .digest("base64");
    const encodedSignature = encodeURIComponent(signature);
    const uploadUrl = `${host}/${objectKey}?OSSAccessKeyId=${oss.accessKeyId}&Expires=${expires}&Signature=${encodedSignature}`;

    return { uploadUrl, fileUrl, objectKey, category };
  }

  /** 获取文件列表（支持类型筛选） */
  async getList(params: {
    page: number;
    pageSize: number;
    keyword?: string;
    fileType?: string;
    groupId?: number;
    uploadBy?: number;
  }) {
    const { page, pageSize, keyword, fileType, uploadBy, groupId } = params;
    const where: any = {};
    const { Op } = require("sequelize");

    if (groupId) {
      where.groupId = groupId;
    }
    if (groupId === 0) {
      where.groupId = null;
      // delete where.groupId;
    }
    if (keyword) {
      where.originalName = { [Op.like]: `%${keyword}%` };
    }

    // 类型筛选
    if (fileType === "image") {
      where.mimeType = { [Op.like]: "image/%" };
    } else if (fileType === "document") {
      where.mimeType = {
        [Op.or]: [
          { [Op.like]: "application/pdf" },
          { [Op.like]: "application/msword" },
          { [Op.like]: "application/vnd.openxmlformats%" },
          { [Op.like]: "application/vnd.ms-excel" },
          { [Op.like]: "application/vnd.ms-powerpoint" },
        ],
      };
    } else if (fileType === "video") {
      where.mimeType = { [Op.like]: "video/%" };
    } else if (fileType === "audio") {
      where.mimeType = { [Op.like]: "audio/%" };
    }

    if (uploadBy) {
      where.uploadBy = uploadBy;
    }

    const { count, rows } = await SysFile.findAndCountAll({
      where,
      order: [["created_at", "DESC"]],
      offset: (page - 1) * pageSize,
      limit: pageSize,
    });

    return { list: rows, total: count, page, pageSize };
  }

  /** 根据ID获取文件 */
  async getById(id: number) {
    const file = await SysFile.findByPk(id);
    if (!file) {
      throw new BusinessError(400, "文件不存在");
    }
    return file;
  }

  /** 删除文件 */
  async delete(id: number) {
    const file = await SysFile.findByPk(id);
    if (!file) {
      throw new BusinessError(400, "文件不存在");
    }

    const fs = require("fs");
    try {
      if (file.storagePath && fs.existsSync(file.storagePath)) {
        fs.unlinkSync(file.storagePath);
      }
    } catch {
      // ignore
    }

    await file.destroy();
  }

  /** 移动文件到分组 */
  async moveToGroup(fileIds: number[], groupId: number | null) {
    const { Op } = require("sequelize");
    const [affectedCount] = await SysFile.update(
      { groupId },
      { where: { id: { [Op.in]: fileIds } } },
    );
    return { affectedCount };
  }

  // ===== 分组管理 =====

  async getGroups() {
    const { sequelize } = await import("../config/database");
    const [rows] = await sequelize.query(
      "SELECT * FROM sys_file_group ORDER BY sort ASC",
    );
    return rows;
  }

  async createGroup(name: string) {
    const { sequelize } = await import("../config/database");
    const [result]: any = await sequelize.query(
      "INSERT INTO sys_file_group (name) VALUES (?)",
      { replacements: [name] },
    );
    return { id: result, name };
  }

  async updateGroup(id: number, name: string) {
    const { sequelize } = await import("../config/database");
    await sequelize.query("UPDATE sys_file_group SET name=? WHERE id=?", {
      replacements: [name, id],
    });
  }

  async deleteGroup(id: number) {
    const { sequelize } = await import("../config/database");
    // 将分组下的文件移到未分组
    await sequelize.query(
      "UPDATE sys_file SET group_id=NULL WHERE group_id=?",
      { replacements: [id] },
    );
    await sequelize.query("DELETE FROM sys_file_group WHERE id=?", {
      replacements: [id],
    });
  }
}

export default new FileService();
