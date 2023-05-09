import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { GiphyService } from './giphy.service';

@Module({
  imports: [HttpModule],
  controllers: [],
  providers: [GiphyService],
  exports: [GiphyService],
})
export class GiphyModule {}
