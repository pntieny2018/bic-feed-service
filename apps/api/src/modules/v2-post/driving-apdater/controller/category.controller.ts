import { Controller, Get, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';

import { VERSIONS_SUPPORTED } from '../../../../common/constants';
import { AuthUser } from '../../../../common/decorators';
import { PageDto } from '../../../../common/dto';
import { UserDto } from '../../../v2-user/application';
import { FindCategoriesPaginationDto } from '../../application/dto/category.dto';
import { FindCategoriesPaginationQuery } from '../../application/query/find-categories/find-categories-pagination.query';
import { GetCategoryRequestDto } from '../dto/request';

@ApiTags('Category')
@ApiSecurity('authorization')
@Controller({
  version: VERSIONS_SUPPORTED,
  path: 'category',
})
export class CategoryController {
  public constructor(private readonly _queryBus: QueryBus) {}

  @ApiOperation({ summary: 'Get categories' })
  @ApiOkResponse({
    type: FindCategoriesPaginationDto,
    description: 'Get category successfully',
  })
  @Get('/')
  public async get(
    @AuthUser() _user: UserDto,
    @Query() getCategoryDto: GetCategoryRequestDto
  ): Promise<PageDto<FindCategoriesPaginationDto>> {
    const { name, level, isCreatedByMe, offset, limit } = getCategoryDto;
    const { rows, total } = await this._queryBus.execute(
      new FindCategoriesPaginationQuery({ name, level, isCreatedByMe, offset, limit })
    );

    return new PageDto<FindCategoriesPaginationDto>(rows, {
      total,
      hasNextPage: total > limit + offset,
      limit: getCategoryDto.limit,
      offset: getCategoryDto.offset,
    });
  }
}
