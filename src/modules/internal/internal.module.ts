import { Module } from '@nestjs/common';
import { PostModule } from '../post';
import { InternalController } from './internal.controller';
import { InternalService } from './internal.service';

@Module({
  imports: [PostModule],
  providers: [InternalService],
  controllers: [InternalController],
})
export class InternalModule {}
