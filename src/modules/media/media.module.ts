import { Module } from '@nestjs/common';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { UploadModule } from '../upload';
import { ValidateMediaConstraint } from './validators/media.validator';

@Module({
  imports: [UploadModule],
  controllers: [MediaController],
  providers: [MediaService, ValidateMediaConstraint],
  exports: [MediaService],
})
export class MediaModule {}
