import { Module } from '@nestjs/common';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { UploadModule } from '../upload';
import { ValidateMedia, ValidateMediaConstraint } from './validators/media.validator';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [UploadModule, ScheduleModule.forRoot()],
  controllers: [MediaController],
  providers: [MediaService, ValidateMediaConstraint],
  exports: [MediaService],
})
export class MediaModule {}
