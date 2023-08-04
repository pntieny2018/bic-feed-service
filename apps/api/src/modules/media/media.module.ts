import { Module } from '@nestjs/common';
import { MediaService } from './media.service';
import { UploadModule } from '../upload';
import { ValidateMediaConstraint } from './validators/media.validator';

@Module({
  imports: [UploadModule],
  providers: [MediaService, ValidateMediaConstraint],
  exports: [MediaService],
})
export class MediaModule {}
