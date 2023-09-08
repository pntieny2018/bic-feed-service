import {
  GROUP_HTTP_TOKEN,
  MEDIA_HTTP_TOKEN,
  USER_HTTP_TOKEN,
  HttpService,
  IAxiosConfig,
  PRIVATE_GATEWAY_HTTP_TOKEN,
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
          useFactory: (configService: ConfigService) => {
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
          useFactory: (configService: ConfigService) => {
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
          useFactory: (configService: ConfigService) => {
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
          provide: PRIVATE_GATEWAY_HTTP_TOKEN,
          useFactory: (configService: ConfigService) => {
            const axiosConfig = configService.get<IAxiosConfig>('axios');
            return new HttpService({
              baseURL: axiosConfig.privateGateway.baseUrl,
              maxRedirects: axiosConfig.privateGateway.maxRedirects,
              timeout: axiosConfig.privateGateway.timeout,
            });
          },
          inject: [ConfigService],
        },
      ],
      exports: [USER_HTTP_TOKEN, GROUP_HTTP_TOKEN, MEDIA_HTTP_TOKEN],
    };
  }
}
