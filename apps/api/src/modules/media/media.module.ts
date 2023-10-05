import { MediaModule as LibMediaModule } from '@libs/service/media/media.module';
import { Module } from '@nestjs/common';

import { UploadModule } from '../upload';

import { MediaService } from './media.service';
import { ValidateMediaConstraint } from './validators/media.validator';

@Module({
  imports: [UploadModule, LibMediaModule],
  providers: [MediaService, ValidateMediaConstraint],
  exports: [MediaService],
})
export class MediaModule {}
