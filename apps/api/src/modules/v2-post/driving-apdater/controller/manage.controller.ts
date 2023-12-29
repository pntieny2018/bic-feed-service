import { TRANSFORMER_VISIBLE_ONLY } from '@libs/common/constants/transfromer.constant';
import { PaginatedArgs, PaginatedResponse } from '@libs/database/postgres/common';
import { REPORT_STATUS } from '@libs/database/postgres/model';
import { UserDto } from '@libs/service/user';
import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Put,
  Query,
  Req,
  Version,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { instanceToInstance } from 'class-transformer';
import { Request } from 'express';

import { ROUTES } from '../../../../common/constants/routes.constant';
import { AuthUser, ResponseMessages } from '../../../../common/decorators';
import { HideReportCommand, IgnoreReportCommand } from '../../application/command/report';
import { ReportForManagerDto, ReportTargetDto } from '../../application/dto';
import { GetListReportsQuery, GetReportQuery } from '../../application/query/admin-manage';

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

  @ApiOperation({ summary: 'Get detail report content' })
  @ApiOkResponse({})
  @ResponseMessages({
    success: 'Get detail report content successfully',
    error: 'Get detail report content failed',
  })
  @Get(ROUTES.MANAGE_REPORTS.GET_DETAIL.PATH)
  @Version(ROUTES.MANAGE_REPORTS.GET_DETAIL.VERSIONS)
  public async getDetailReportContent(
    @AuthUser() authUser: UserDto,
    @Param('rootGroupId', ParseUUIDPipe) rootGroupId: string,
    @Param('reportId', ParseUUIDPipe) reportId: string
  ): Promise<ReportTargetDto> {
    const report = await this._queryBus.execute(
      new GetReportQuery({ groupId: rootGroupId, reportId, authUser })
    );
    return instanceToInstance(report, { groups: [TRANSFORMER_VISIBLE_ONLY.PUBLIC] });
  }

  @ApiOperation({ summary: 'Community admin process the content/comment report' })
  @ApiOkResponse({ description: 'Process report successfully' })
  @Put(ROUTES.MANAGE_REPORTS.PROCESS.PATH)
  @Version(ROUTES.MANAGE_REPORTS.PROCESS.VERSIONS)
  public async processReport(
    @Req() req: Request,
    @AuthUser() authUser: UserDto,
    @Param('rootGroupId', ParseUUIDPipe) rootGroupId: string,
    @Param('reportId', ParseUUIDPipe) reportId: string,
    @Body('status') status: Omit<REPORT_STATUS, REPORT_STATUS.CREATED>
  ): Promise<void> {
    if (status === REPORT_STATUS.IGNORED) {
      req.message = 'message.report.ignored_success';
      return this._commandBus.execute(
        new IgnoreReportCommand({ groupId: rootGroupId, reportId, authUser })
      );
    } else {
      req.message = 'message.report.hidden_success';
      return this._commandBus.execute(
        new HideReportCommand({ groupId: rootGroupId, reportId, authUser })
      );
    }
  }
}
