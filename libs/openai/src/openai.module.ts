import { Module } from '@nestjs/common';
import { OpenaiService } from './openai.service';
import { ConfigModule } from '@nestjs/config';
import { configs } from '@app/openai/config/configuration';

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
