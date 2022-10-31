import { IS3Config } from './s3.interface';

export const getS3Config = (): IS3Config => ({
  region: process.env.AWS_S3_REGION,
  accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
  userSharingAssetsBucket: process.env.AWS_S3_USER_SHARING_ASSETS_BUCKET,
  ACL: process.env.AWS_S3_ALC_DEFAULT,
});
