import {
  GROUP_HTTP_TOKEN,
  HttpModule,
  IAxiosConfig,
  IHttpServiceOptions,
  USER_HTTP_TOKEN,
} from '@libs/infra/http';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { UserService } from './src/user.service';
import { USER_SERVICE_TOKEN } from './src/user.service.interface';

@Module({
  imports: [
    HttpModule.forRoot([
      {
        provide: USER_HTTP_TOKEN,
        useFactory: (configService: ConfigService): IHttpServiceOptions => {
          const axiosConfig = configService.get<IAxiosConfig>('axios');
          return {
            baseURL: axiosConfig.user.baseUrl,
            maxRedirects: axiosConfig.user.maxRedirects,
            timeout: axiosConfig.user.timeout,
          };
        },
        inject: [ConfigService],
      },
      {
        provide: GROUP_HTTP_TOKEN,
        useFactory: (configService: ConfigService): IHttpServiceOptions => {
          const axiosConfig = configService.get<IAxiosConfig>('axios');
          return {
            baseURL: axiosConfig.group.baseUrl,
            maxRedirects: axiosConfig.group.maxRedirects,
            timeout: axiosConfig.group.timeout,
          };
        },
        inject: [ConfigService],
      },
    ]),
  ],
  providers: [{ provide: USER_SERVICE_TOKEN, useClass: UserService }],
  exports: [USER_SERVICE_TOKEN],
})
export class UserModule {}
