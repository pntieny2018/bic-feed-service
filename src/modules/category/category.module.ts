import { Module } from '@nestjs/common';
import { CategoryService } from './category.service';

@Module({
  imports: [],
  // controllers: [CategoryController],
  providers: [CategoryService],
  exports: [CategoryService],
})
export class CategoryModule {}
