import { MediaModule as LibMediaModule } from '@libs/service/media/media.module';
import { Module } from '@nestjs/common';

import { ValidateMediaConstraint } from './validators/media.validator';

@Module({
  imports: [LibMediaModule],
  providers: [ValidateMediaConstraint],
  exports: [],
})
export class MediaModule {}
