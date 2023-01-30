import { CopyObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import * as uuid from 'uuid';
import { IS3Config } from '../../config/s3';
import { UploadPrefix } from './dto/requests/upload.dto';
@Injectable()
export class UploadService {
  private _storage: S3Client;
  private _s3Config: IS3Config;
  protected logger = new Logger(UploadService.name);
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
    try {
      const key = this.getKey(uploadType, {
        extension: path.extname(file.originalname),
      });
      const bucket = this._s3Config.userSharingAssetsBucket;

      await this._storage.send(
        new PutObjectCommand({
          Bucket: bucket,
          Body: file.buffer,
          ContentType: file.mimetype,
          Key: key,
          ACL: alc,
        })
      );
      return `https://${bucket}.s3.${this._s3Config.region}.amazonaws.com/${key}`;
    } catch (e) {
      this.logger.debug(JSON.stringify(e?.stack));
      throw e;
    }
  }

  public async update(filePath: string, contentType: string): Promise<any> {
    try {
      const bucket = this._s3Config.userSharingAssetsBucket;

      const res = await this._storage.send(
        new CopyObjectCommand({
          Bucket: bucket,
          ContentType: contentType,
          Key: filePath,
          CopySource: `${bucket}/${filePath}`,
          MetadataDirective: 'REPLACE',
        })
      );
      console.log('res', res);
    } catch (e) {
      this.logger.debug(JSON.stringify(e?.stack));
      throw e;
    }
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
