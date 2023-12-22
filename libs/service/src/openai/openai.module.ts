import {
  HttpModule,
  IAxiosConfig,
  IHttpServiceOptions,
  LAMBDA_COUNT_TOKEN_HTTP_TOKEN,
} from '@libs/infra/http';
import { configs } from '@libs/service/openai/config';
import { OPEN_AI_SERVICE_TOKEN } from '@libs/service/openai/openai.service.interface';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { OpenAIService } from './openai.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      load: [configs],
    }),
    HttpModule.forRoot([
      {
        provide: LAMBDA_COUNT_TOKEN_HTTP_TOKEN,
        useFactory: (configService: ConfigService): IHttpServiceOptions => {
          const axiosConfig = configService.get<IAxiosConfig>('axios');
          return {
            baseURL: axiosConfig.lambda.baseUrl,
            maxRedirects: axiosConfig.lambda.maxRedirects,
            timeout: axiosConfig.lambda.timeout,
          };
        },
        inject: [ConfigService],
      },
    ]),
  ],
  providers: [
    {
      provide: OPEN_AI_SERVICE_TOKEN,
      useClass: OpenAIService,
    },
  ],
  exports: [OPEN_AI_SERVICE_TOKEN],
})
export class OpenaiModule {}
