import { GROUP_HTTP_TOKEN, HttpModule, IAxiosConfig, IHttpServiceOptions } from '@libs/infra/http';
import { GroupService } from '@libs/service/group/src/group.service';
import { GROUP_SERVICE_TOKEN } from '@libs/service/group/src/group.service.interface';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    HttpModule.forRoot([
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
  providers: [
    {
      provide: GROUP_SERVICE_TOKEN,
      useClass: GroupService,
    },
  ],
  exports: [GROUP_SERVICE_TOKEN],
})
export class GroupModule {}
