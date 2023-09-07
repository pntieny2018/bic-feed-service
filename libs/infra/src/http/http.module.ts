import {
  GROUP_HTTP_TOKEN,
  MEDIA_HTTP_TOKEN,
  USER_HTTP_TOKEN,
  HttpService,
  IAxiosConfig,
  LAMBDA_COUNT_TOKEN_HTTP_TOKEN,
} from '@libs/infra/http';
import { DynamicModule, Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Global()
@Module({
  imports: [ConfigModule],
})
export class HttpModule {
  public static forRoot(): DynamicModule {
    return {
      module: HttpModule,
      providers: [
        {
          provide: USER_HTTP_TOKEN,
          useFactory: (configService: ConfigService): HttpService => {
            const axiosConfig = configService.get<IAxiosConfig>('axios');
            return new HttpService({
              baseURL: axiosConfig.user.baseUrl,
              maxRedirects: axiosConfig.user.maxRedirects,
              timeout: axiosConfig.user.timeout,
            });
          },
          inject: [ConfigService],
        },
        {
          provide: GROUP_HTTP_TOKEN,
          useFactory: (configService: ConfigService): HttpService => {
            const axiosConfig = configService.get<IAxiosConfig>('axios');
            return new HttpService({
              baseURL: axiosConfig.group.baseUrl,
              maxRedirects: axiosConfig.group.maxRedirects,
              timeout: axiosConfig.group.timeout,
            });
          },
          inject: [ConfigService],
        },
        {
          provide: MEDIA_HTTP_TOKEN,
          useFactory: (configService: ConfigService): HttpService => {
            const axiosConfig = configService.get<IAxiosConfig>('axios');
            return new HttpService({
              baseURL: axiosConfig.upload.baseUrl,
              maxRedirects: axiosConfig.upload.maxRedirects,
              timeout: axiosConfig.upload.timeout,
            });
          },
          inject: [ConfigService],
        },
        {
          provide: LAMBDA_COUNT_TOKEN_HTTP_TOKEN,
          useFactory: (configService: ConfigService): HttpService => {
            const axiosConfig = configService.get<IAxiosConfig>('axios');
            return new HttpService({
              baseURL: axiosConfig.lambda.baseUrl,
              maxRedirects: axiosConfig.lambda.maxRedirects,
              timeout: axiosConfig.lambda.timeout,
            });
          },
          inject: [ConfigService],
        },
      ],
      exports: [USER_HTTP_TOKEN, GROUP_HTTP_TOKEN, MEDIA_HTTP_TOKEN, LAMBDA_COUNT_TOKEN_HTTP_TOKEN],
    };
  }
}
