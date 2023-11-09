import { PaginatedArgs } from '@libs/database/postgres/common';
import { UserDto } from '@libs/service/user';
import { Controller, Get, Param, ParseUUIDPipe, Query, Version } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';

import { ROUTES } from '../../../../common/constants/routes.constant';
import { AuthUser, ResponseMessages } from '../../../../common/decorators';
import { GetListReportsPaginationDto } from '../../application/dto';
import { GetListReportsQuery } from '../../application/query/admin-manage';

@ApiTags('v2 admin manage')
@ApiSecurity('authorization')
@Controller()
export class AdminManageController {
  public constructor(
    private readonly _commandBus: CommandBus,
    private readonly _queryBus: QueryBus
  ) {}

  @ApiOperation({ summary: 'Get list report contents' })
  @ApiOkResponse({})
  @ResponseMessages({
    success: 'Get list report contents successfully',
    error: 'Get list report contents failed',
  })
  @Get(ROUTES.MANAGE_REPORTS.GET_LIST.PATH)
  @Version(ROUTES.MANAGE_REPORTS.GET_LIST.VERSIONS)
  public getListReportContents(
    @AuthUser() authUser: UserDto,
    @Param('rootGroupId', ParseUUIDPipe) rootGroupId: string,
    @Query() paginateOption: PaginatedArgs
  ): Promise<GetListReportsPaginationDto> {
    return this._queryBus.execute(
      new GetListReportsQuery({ groupId: rootGroupId, authUser, ...paginateOption })
    );
  }
}
