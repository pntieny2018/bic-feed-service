import { Global, Module } from '@nestjs/common';
import {
  AxiosService,
  GROUP_AXIOS_TOKEN,
  MEDIA_AXIOS_TOKEN,
  USER_AXIOS_TOKEN,
} from '@app/infra/http';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { IAxiosConfig } from 'apps/api/src/config/axios';

@Global()
@Module({
  imports: [ConfigModule],
})
export class AxiosModule {
  static forRoot() {
    return {
      module: AxiosModule,
      providers: [
        {
          provide: USER_AXIOS_TOKEN,
          useFactory: (configService: ConfigService) => {
            const axiosConfig = configService.get<IAxiosConfig>('axios');
            return AxiosService.createAxiosInstance({
              baseURL: axiosConfig.user.baseUrl,
              maxRedirects: axiosConfig.user.maxRedirects,
              timeout: axiosConfig.user.timeout,
            });
          },
          inject: [ConfigService],
        },
        {
          provide: GROUP_AXIOS_TOKEN,
          useFactory: (configService: ConfigService) => {
            const axiosConfig = configService.get<IAxiosConfig>('axios');
            return AxiosService.createAxiosInstance({
              baseURL: axiosConfig.group.baseUrl,
              maxRedirects: axiosConfig.group.maxRedirects,
              timeout: axiosConfig.group.timeout,
            });
          },
          inject: [ConfigService],
        },
        {
          provide: MEDIA_AXIOS_TOKEN,
          useFactory: (configService: ConfigService) => {
            const axiosConfig = configService.get<IAxiosConfig>('axios');
            return AxiosService.createAxiosInstance({
              baseURL: axiosConfig.upload.baseUrl,
              maxRedirects: axiosConfig.upload.maxRedirects,
              timeout: axiosConfig.upload.timeout,
            });
          },
          inject: [ConfigService],
        },
      ],
    };
  }
}
