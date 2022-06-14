import { Module } from '@nestjs/common';
import { GiphyController } from './giphy.controller';
import { HttpModule } from '@nestjs/axios';
import { GiphyService } from './giphy.service';

@Module({
  imports: [HttpModule],
  controllers: [GiphyController],
  providers: [GiphyService],
  exports: [GiphyService],
})
export class GiphyModule {}
