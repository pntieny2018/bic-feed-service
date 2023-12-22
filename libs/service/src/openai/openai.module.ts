import { configs } from '@libs/service/openai/config';
import { OPEN_AI_SERVICE_TOKEN } from '@libs/service/openai/openai.service.interface';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { OpenAIService } from './openai.service';

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
