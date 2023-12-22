import { HttpModule, IAxiosConfig, IHttpServiceOptions, MEDIA_HTTP_TOKEN } from '@libs/infra/http';
import { MEDIA_SERVICE_TOKEN } from '@libs/service/media/src/interface';
import { MediaService } from '@libs/service/media/src/media.service';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    HttpModule.forRoot([
      {
        provide: MEDIA_HTTP_TOKEN,
        useFactory: (configService: ConfigService): IHttpServiceOptions => {
          const axiosConfig = configService.get<IAxiosConfig>('axios');
          return {
            baseURL: axiosConfig.upload.baseUrl,
            maxRedirects: axiosConfig.upload.maxRedirects,
            timeout: axiosConfig.upload.timeout,
          };
        },
        inject: [ConfigService],
      },
    ]),
  ],
  providers: [
    {
      provide: MEDIA_SERVICE_TOKEN,
      useClass: MediaService,
    },
  ],
  exports: [MEDIA_SERVICE_TOKEN],
})
export class MediaModule {}
