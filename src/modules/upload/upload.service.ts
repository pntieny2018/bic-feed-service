import AWS from 'aws-sdk';
import { Injectable } from '@nestjs/common';
import * as uuid from 'uuid';
import * as path from 'path';

@Injectable()
export class UploadService {
  constructor(private readonly _s3: AWS.S3) {
    this._s3 = new AWS.S3({
      accessKeyId: '',
      secretAccessKey: '',
    });
  }

  async upload(file: Express.Multer.File): Promise<any> {
    return new Promise((resolve, reject) => {
      const key = UploadService.getKey('', {
        extension: path.extname(file.originalname),
      });

      this._s3.upload(
        {
          Bucket: this.getBucket(''),
          Body: file.buffer,
          Key: key,
          ContentType: file.mimetype,
          ACL: '',
        },
        (err, data) => {
          if (err) return reject(err);
          return resolve({ src: data.Location });
        }
      );
    });
  }

  async getSignedUrl(
    uploadType: string,
    originalName: string,
    mimeType: string
  ): Promise<{ uploadURL: string; objectPath: string }> {
    return new Promise((resolve, reject) => {
      const key = UploadService.getKey(uploadType, {
        extension: path.extname(originalName),
      });

      const bucket = this.getBucket(uploadType);

      const objectPath = `https://${bucket}.s3.${'region'}.amazonaws.com/${key}`;

      const params = {
        Bucket: bucket,
        Key: key,
        Expires: 10,
        ACL: '',
        ContentType: mimeType,
      };
      this._s3.getSignedUrl('putObject', params, function (err, url) {
        if (err) return reject(err);
        return resolve({ uploadURL: url, objectPath: objectPath });
      });
    });
  }

  /**
   * get S3 object key (file path)
   * @param uploadType
   * @param option extension: .png .jpg .mp4 .docx ...
   * @returns
   */
  public static getKey(uploadType: string, option?: { extension: string }): string {
    const UUID = uuid.v4();
    const prefix = '';
    if (!prefix) throw new Error('generate s3 path failed');
    let key = `${prefix}/${UUID}`;
    key += option?.extension || '';
    return key;
  }

  public getBucket(uploadType: string): string {
    if ([].includes(uploadType)) {
      return 'this.s3Config.entityAttributeBucket';
    }
    return 'this.s3Config.userSharingAssetsBucket';
  }
}
