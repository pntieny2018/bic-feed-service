import { IS3Config } from './s3.interface';

export const getS3Config = (): IS3Config => ({
  region: process.env.AWS_S3_REGION,
  userSharingAssetsBucket:
    process.env.AWS_S3_USER_UPLOAD_IMAGES_BUCKET || process.env.AWS_S3_USER_SHARING_ASSETS_BUCKET,
  ACL: process.env.AWS_S3_ALC_DEFAULT,
});
