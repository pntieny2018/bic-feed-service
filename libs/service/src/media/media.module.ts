import { MEDIA_SERVICE_TOKEN } from '@libs/service/media/src/interface';
import { MediaService } from '@libs/service/media/src/media.service';
import { Module } from '@nestjs/common';

@Module({
  imports: [],
  providers: [
    {
      provide: MEDIA_SERVICE_TOKEN,
      useClass: MediaService,
    },
  ],
  exports: [MEDIA_SERVICE_TOKEN],
})
export class MediaModule {}
