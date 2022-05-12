import { Module } from '@nestjs/common';
import { GiphyController } from './giphy.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [GiphyController]
})
export class GiphyModule {}
