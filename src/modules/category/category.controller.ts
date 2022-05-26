import { ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Body, Controller, Post } from '@nestjs/common';
import { APP_VERSION } from '../../common/constants';
import { ResponseMessages } from '../../common/decorators';
import { CategoryResponseDto } from './dto/responses/category-response.dto';
import { AuthUser, UserDto } from '../auth';
import { CreateCategoryDto } from './dto/requests/create-category.dto';
import { CategoryService } from './category.service';

@ApiTags('Category')
@ApiSecurity('authorization')
@Controller({
  version: APP_VERSION,
  path: 'category',
})
export class CategoryController {
  public constructor(private _categoryService: CategoryService) {}

  @ApiOperation({ summary: 'Create new category' })
  @ApiOkResponse({
    type: CategoryResponseDto,
    description: 'Create category successfully',
  })
  @ResponseMessages({
    success: 'Create category successfully',
  })
  @Post('/')
  public async create(
    @AuthUser() user: UserDto,
    @Body() createCategoryDto: CreateCategoryDto
  ): Promise<CategoryResponseDto> {
    return this._categoryService.createCategory(user, createCategoryDto);
  }
}
