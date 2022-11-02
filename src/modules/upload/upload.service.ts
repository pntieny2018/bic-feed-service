import * as uuid from 'uuid';
import * as path from 'path';
import { Injectable } from '@nestjs/common';
import { IS3Config } from '../../config/s3';
import { ConfigService } from '@nestjs/config';
import { UploadPrefix } from './dto/requests/upload.dto';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

@Injectable()
export class UploadService {
  private _storage: S3Client;
  private _s3Config: IS3Config;

  public constructor(private _configService: ConfigService) {
    const s3Config = this._configService.get<IS3Config>('s3');
    this._s3Config = s3Config;
    this._storage = new S3Client({
      region: s3Config.region,
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
    alc = 'public-read'
  ): Promise<string> {
    const key = this.getKey(uploadType, {
      extension: path.extname(file.originalname),
    });
    const bucket = this._s3Config.userSharingAssetsBucket;

    await this._storage.send(
      new PutObjectCommand({
        Bucket: bucket,
        Body: file.buffer,
        Key: key,
        ACL: alc,
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
  public getKey(uploadType: string, option: { extension: string }): string {
    const UUID = uuid.v4();
    const prefix = UploadPrefix[uploadType];

    if (!prefix) throw new Error('generate s3 path failed');

    return `${prefix}/${UUID}${option.extension}`;
  }
}
