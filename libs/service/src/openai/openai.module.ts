import { configs } from '@libs/service/openai';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { OpenaiService } from './openai.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      load: [configs],
    }),
  ],
  providers: [OpenaiService],
  exports: [OpenaiService],
})
export class OpenaiModule {}
