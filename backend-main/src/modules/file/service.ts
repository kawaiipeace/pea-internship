import { GetObjectCommand } from "@aws-sdk/client-s3";
import { NotFoundError } from "elysia";
import { BUCKET_NAME, s3Client } from "@/lib/s3";

export class FileService {
  async getFile(key: string) {
    try {
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      });

      const data = await s3Client.send(command);

      return {
        buffer: await data.Body?.transformToByteArray(),
        contentType: data.ContentType || "application/octet-stream",
      };
    } catch (error) {
      console.error("Error fetching file from MinIO:", error);
      throw new NotFoundError("ไม่พบไฟล์ที่ต้องการ หรือไฟล์ถูกลบไปแล้ว");
    }
  }
}
