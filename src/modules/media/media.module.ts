import { Module } from '@nestjs/common';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { UploadModule } from '../upload';
import { DatabaseModule } from '../../database';

@Module({
  imports: [UploadModule, DatabaseModule],
  controllers: [MediaController],
  providers: [MediaService],
})
export class MediaModule {}
