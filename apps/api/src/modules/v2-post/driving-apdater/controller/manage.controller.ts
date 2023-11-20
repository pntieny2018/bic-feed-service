import { PaginatedArgs, PaginatedResponse } from '@libs/database/postgres/common';
import { UserDto } from '@libs/service/user';
import { Controller, Get, Param, ParseUUIDPipe, Put, Query, Version } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';

import { ROUTES } from '../../../../common/constants/routes.constant';
import { AuthUser, ResponseMessages } from '../../../../common/decorators';
import { IgnoreReportCommand } from '../../application/command/report';
import { ReportForManagerDto } from '../../application/dto';
import { GetListReportsQuery } from '../../application/query/admin-manage';

@ApiTags('v2 admin manage')
@ApiSecurity('authorization')
@Controller()
export class ManageController {
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
  public async getListReportContents(
    @AuthUser() authUser: UserDto,
    @Param('rootGroupId', ParseUUIDPipe) rootGroupId: string,
    @Query() paginateOption: PaginatedArgs
  ): Promise<PaginatedResponse<ReportForManagerDto>> {
    return this._queryBus.execute(
      new GetListReportsQuery({ groupId: rootGroupId, authUser, ...paginateOption })
    );
  }

  @ApiOperation({ summary: 'Community admin ignores the content/comment report' })
  @ApiOkResponse({ description: 'Ignore report successfully' })
  @ResponseMessages({
    success: 'Ignore report successfully',
    error: 'Ignore report failed',
  })
  @Put(ROUTES.MANAGE_REPORTS.IGNORE.PATH)
  @Version(ROUTES.MANAGE_REPORTS.IGNORE.VERSIONS)
  public async ignoreReport(
    @AuthUser() authUser: UserDto,
    @Param('rootGroupId', ParseUUIDPipe) rootGroupId: string,
    @Param('reportId', ParseUUIDPipe) reportId: string
  ): Promise<PaginatedResponse<ReportForManagerDto>> {
    return this._commandBus.execute(
      new IgnoreReportCommand({ groupId: rootGroupId, reportId, authUser })
    );
  }
}
