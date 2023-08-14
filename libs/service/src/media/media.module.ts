import { MediaService } from '@libs/service/media/src/media.service';
import { Module } from '@nestjs/common';

@Module({
  imports: [],
  providers: [MediaService],
  exports: [MediaService],
})
export class MediaModule {}
