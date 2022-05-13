import { Module } from '@nestjs/common';
import { GiphyController } from './giphy.controller';
import { HttpModule } from '@nestjs/axios';
import { GiphyService } from './giphy.service';
import { DatabaseModule } from '../../database';

@Module({
  imports: [DatabaseModule, HttpModule],
  controllers: [GiphyController],
  providers: [GiphyService],
  exports: [GiphyService],
})
export class GiphyModule {}
