import { ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Controller, Get, Query } from '@nestjs/common';
import { APP_VERSION } from '../../../../common/constants';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ClassTransformer } from 'class-transformer';
import { CategoryResponseDto } from '../dto/response';
import { AuthUser } from '../../../auth';
import { UserDto } from '../../../v2-user/application';
import { GetCategoryDto } from '../../../category/dto/requests/get-category.dto';
import { PageDto } from '../../../../common/dto';
import { FindCategoriesPaginationQuery } from '../../application/query/find-categories/find-categories-pagination.query';

@ApiTags('Category')
@ApiSecurity('authorization')
@Controller({
  version: APP_VERSION,
  path: 'category',
})
export class CategoryController {
  public constructor(
    private readonly _commandBus: CommandBus,
    private readonly _queryBus: QueryBus
  ) {}

  private _classTransformer = new ClassTransformer();

  @ApiOperation({ summary: 'Get categories' })
  @ApiOkResponse({
    type: CategoryResponseDto,
    description: 'Get category successfully',
  })
  @Get('/')
  public async get(
    @AuthUser() _user: UserDto,
    @Query() getCategoryDto: GetCategoryDto
  ): Promise<PageDto<CategoryResponseDto>> {
    const { name, level, isCreatedByMe, offset, limit } = getCategoryDto;
    const { rows, total } = await this._queryBus.execute(
      new FindCategoriesPaginationQuery({ name, level, isCreatedByMe, offset, limit })
    );

    const categories = rows.map((row) =>
      this._classTransformer.plainToInstance(CategoryResponseDto, row, {
        excludeExtraneousValues: true,
      })
    );

    return new PageDto<CategoryResponseDto>(categories, {
      total,
      hasNextPage: total > limit + offset,
      limit: getCategoryDto.limit,
      offset: getCategoryDto.offset,
    });
  }
}
