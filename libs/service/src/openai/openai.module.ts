import { configs } from '@libs/infra/queue/config';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { OpenAIService } from './openai.service';
import { OPEN_AI_SERVICE_TOKEN } from './openai.service.interface';

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
export class OpenAIModule {}
