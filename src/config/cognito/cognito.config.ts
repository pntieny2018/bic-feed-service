import { ICognitoConfig } from './cognito-config.interface';

export const getCognitoConfig = (): ICognitoConfig => ({
  region: process.env.AWS_COGNITO_REGION,
  poolId: process.env.AWS_COGNITO_POOL_ID,
  appClientId: process.env.AWS_COGNITO_APP_CLIENT_ID,
  identityPoolId: process.env.AWS_COGNITO_IDENTITY_POOL_ID,
  userPoolsId: process.env.AWS_COGNITO_USER_POOLS_ID,
});
