import { ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Body, Controller, Get, Logger, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { VERSIONS_SUPPORTED } from '../../common/constants';
import { AuthUser, ResponseMessages } from '../../common/decorators';
import { CategoryResponseDto } from './dto/responses/category-response.dto';
import { CreateCategoryDto } from './dto/requests/create-category.dto';
import { CategoryService } from './category.service';
import { PageDto } from '../../common/dto';
import { GetCategoryDto } from './dto/requests/get-category.dto';
import { UserDto } from '../v2-user/application';

@ApiTags('Category')
@ApiSecurity('authorization')
@Controller({
  version: VERSIONS_SUPPORTED,
  path: 'category',
})
export class CategoryController {
  public constructor(private _categoryService: CategoryService) {}
  private _logger = new Logger(CategoryController.name);
  @ApiOperation({ summary: 'Get categories' })
  @ApiOkResponse({
    type: CategoryResponseDto,
    description: 'Get category successfully',
  })
  @ResponseMessages({
    success: 'Get category successfully',
  })
  @Get('/')
  public async get(
    @AuthUser() user: UserDto,
    @Query() getCategoryDto: GetCategoryDto
  ): Promise<PageDto<CategoryResponseDto>> {
    return this._categoryService.get(user, getCategoryDto);
  }

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
    return this._categoryService.create(user, createCategoryDto);
  }

  @ApiOperation({ summary: 'Get category' })
  @ApiOkResponse({
    type: CategoryResponseDto,
    description: 'Get category successfully',
  })
  @ResponseMessages({
    success: 'Get category successfully',
  })
  @Get('/:id')
  public async getDetail(@Param('id', ParseUUIDPipe) id: string): Promise<CategoryResponseDto> {
    return this._categoryService.getDetail(id);
  }
}
