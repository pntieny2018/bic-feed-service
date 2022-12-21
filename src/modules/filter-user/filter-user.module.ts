import { Module } from '@nestjs/common';
import { FilterUserService } from './filter-user.service';

@Module({
  providers: [FilterUserService],
  exports: [FilterUserService],
})
export class FilterUserModule {}
