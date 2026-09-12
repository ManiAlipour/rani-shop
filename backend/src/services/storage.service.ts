import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import crypto from "crypto";
import path from "path";

class StorageService {
  private client: S3Client;
  private bucketName: string;
  private endpoint: string;

  constructor() {
    this.endpoint = process.env.S3_ENDPOINT || "";
    this.bucketName = process.env.S3_BUCKET_NAME || "";

    this.client = new S3Client({
      region: process.env.S3_REGION || "default",
      endpoint: this.endpoint,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY || "",
        secretAccessKey: process.env.S3_SECRET_KEY || "",
      },
      forcePathStyle: true, // برای سازگاری کامل با آروان‌کلاد و استوریج‌های S3-Compatible
    });
  }

  private generateUniqueFileName(originalName: string): string {
    const randomHash = crypto.randomBytes(8).toString("hex");
    const sanitizedName = path
      .parse(originalName)
      .name.toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .slice(0, 30);
    return `${Date.now()}-${sanitizedName}-${randomHash}.webp`;
  }

  /**
   * آپلود مستقیم بافر تصویر به باکت
   * @param buffer بافر بهینه‌شده تصویر
   * @param folder پوشه مقصد (مثل products, categories, banners)
   * @param originalName نام اولیه فایل
   */
  async uploadFile(
    buffer: Buffer,
    folder: string = "general",
    originalName: string = "image",
  ): Promise<{ url: string; key: string; size: number }> {
    const fileName = this.generateUniqueFileName(originalName);
    const key = `${folder.replace(/\/+$/, "")}/${fileName}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: buffer,
      ContentType: "image/webp",
      ACL: "public-read", // دسترسی عمومی برای خواندن تصویر
    });

    await this.client.send(command);

    // ساخت آدرس عمومی عکس در آروان
    const publicUrl = `${this.endpoint}/${this.bucketName}/${key}`;

    return {
      url: publicUrl,
      key,
      size: buffer.length,
    };
  }

  async deleteFile(key: string): Promise<boolean> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.client.send(command);
      return true;
    } catch (error) {
      console.error(`خطا در حذف فایل ${key} از استوریج:`, error);
      return false;
    }
  }

  async checkFileExists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      await this.client.send(command);
      return true;
    } catch {
      return false;
    }
  }
}

export const storageService = new StorageService();
export default storageService;
