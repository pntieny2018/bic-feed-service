import { Module } from '@nestjs/common';
import { OpenaiService } from './openai.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { configs } from '@app/openai/config/configuration';
import { HttpModule } from '@nestjs/axios';
import { IAxiosConfig } from '../../../apps/api/src/config/axios';

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      load: [configs],
    }),
    HttpModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const axiosConfig = configService.get<IAxiosConfig>('axios');
        return {
          baseURL: axiosConfig.lambda.baseUrl,
          maxRedirects: axiosConfig.lambda.maxRedirects,
          timeout: axiosConfig.lambda.timeout,
        };
      },
    }),
  ],
  providers: [OpenaiService],
  exports: [OpenaiService],
})
export class OpenaiModule {}
