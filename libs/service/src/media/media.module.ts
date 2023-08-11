import { Module } from '@nestjs/common';
import { MediaService } from '@app/service/media/src/media.service';

@Module({
  imports: [],
  providers: [MediaService],
  exports: [MediaService],
})
export class MediaModule {}
