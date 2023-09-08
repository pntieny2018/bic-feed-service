import { Module } from '@nestjs/common';

import { OpenAIService } from './openai.service';
import { OPEN_AI_SERVICE_TOKEN } from '@libs/service/openai/openai.service.interface';
import { ConfigModule } from '@nestjs/config';
import { configs } from '@libs/infra/kafka/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      load: [configs],
    }),
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
