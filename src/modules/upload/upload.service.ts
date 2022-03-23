import * as uuid from 'uuid';
import * as path from 'path';
import { Injectable } from '@nestjs/common';
import { IS3Config } from '../../config/s3';
import { ConfigService } from '@nestjs/config';
import { UploadPrefix } from './dto/requests/upload.dto';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

@Injectable()
export class UploadService {
  private readonly _storage: S3Client;
  private readonly _s3Config: IS3Config;

  public constructor(private _configService: ConfigService) {
    const s3Config = this._configService.get<IS3Config>('s3');
    this._s3Config = s3Config;
    this._storage = new S3Client({
      region: s3Config.region,
      credentials: {
        accessKeyId: s3Config.accessKeyId,
        secretAccessKey: s3Config.secretAccessKey,
      },
    });
  }

  /**
   * Upload file to S3
   * @param file Express.Multer.File
   * @param uploadType String,
   * @param alc String
   */
  public async upload(
    file: Express.Multer.File,
    uploadType: string,
    alc?: string
  ): Promise<string> {
    const key = UploadService.getKey(uploadType, {
      extension: path.extname(file.originalname),
    });

    const bucket = this.getBucket();

    await this._storage.send(
      new PutObjectCommand({
        Bucket: bucket,
        Body: file.buffer,
        Key: key,
        ACL: alc ?? this._s3Config.ACL,
      })
    );
    return `https://${bucket}.s3.${this._s3Config.region}.amazonaws.com/${key}`;
  }

  /**
   * get S3 object key (file path)
   * @param uploadType
   * @param option extension: .png .jpg .mp4 .docx ...
   * @returns
   */
  public static getKey(uploadType: string, option?: { extension: string }): string {
    const UUID = uuid.v4();
    const prefix = UploadPrefix[uploadType];

    if (!prefix) throw new Error('generate s3 path failed');

    return `${prefix}/${UUID}${option?.extension || ''}`;
  }

  public getBucket(): string {
    return this._s3Config.userSharingAssetsBucket;
  }
}
