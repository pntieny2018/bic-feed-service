import { ApiParam, ApiSecurity, ApiTags } from '@nestjs/swagger';
import {
  CreateReportDto,
  GetBlockedContentOfMeDto,
  GetReportDto,
  ReportReviewResponsesDto,
  StatisticsReportResponsesDto,
  UpdateStatusReportDto,
} from './dto';
import { ReportContentService } from './report-content.service';
import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { DetailContentReportResponseDto } from './dto/detail-content-report.response.dto';
import { UserDto } from '../v2-user/application';
import { AuthUser, ResponseMessages } from '../../common/decorators';
import { Request } from 'express';
import { ReportStatus } from './contstants';
import { VERSIONS_SUPPORTED } from '../../common/constants';

@ApiTags('Reports')
@Controller({
  path: 'reports',
  version: VERSIONS_SUPPORTED,
})
@ApiSecurity('authorization')
export class ReportContentController {
  public constructor(private readonly _reportContentService: ReportContentService) {}

  @Get('/review')
  public async getContentsReported(
    @AuthUser() user: UserDto,
    @Query() getReportDto: GetReportDto
  ): Promise<ReportReviewResponsesDto[]> {
    return this._reportContentService.getReports(user, getReportDto);
  }

  @Get('/me/content')
  public async getContentsBlockedOfMe(
    @AuthUser() user: UserDto,
    @Query() getOptions: GetBlockedContentOfMeDto
  ): Promise<any> {
    return await this._reportContentService.getContentBlockedOfMe(user, getOptions);
  }

  @ApiParam({
    name: 'id',
    description: 'Target id',
  })
  @Get('/:rootGroupId/content/:targetId')
  public async getDetailReportContent(
    @AuthUser() user: UserDto,
    @Param('rootGroupId', ParseUUIDPipe) rootGroupId: string,
    @Param('targetId', ParseUUIDPipe) targetId: string
  ): Promise<DetailContentReportResponseDto> {
    // TODO check permission
    return this._reportContentService.getContent(user, rootGroupId, targetId);
  }

  @ApiParam({
    name: 'reportId',
    description: 'Report id',
  })
  @ApiParam({
    name: 'targetId',
    description: 'Target id',
  })
  @Get(':reportId/statistics/:targetId')
  public async getStatistics(
    @AuthUser() user: UserDto,
    @Param('reportId', ParseUUIDPipe) reportId: string,
    @Param('targetId', ParseUUIDPipe) targetId: string,
    @Query('group_id', ParseUUIDPipe) groupId: string,
    @Query('count_reporter') countReporter = 5
  ): Promise<StatisticsReportResponsesDto> {
    // TODO check permission
    return this._reportContentService.getStatistics(
      user,
      reportId,
      targetId,
      groupId,
      countReporter
    );
  }

  @ResponseMessages({
    success: 'message.content.reported_success',
  })
  @Post('/content')
  public async report(
    @AuthUser() user: UserDto,
    @Body() createReportDto: CreateReportDto
  ): Promise<any> {
    // TODO check permission
    return this._reportContentService.report(user, createReportDto);
  }

  @Patch('/status')
  public async updateStatus(
    @AuthUser() user: UserDto,
    @Body() updateStatusReportDto: UpdateStatusReportDto,
    @Req() req: Request
  ): Promise<boolean> {
    if (updateStatusReportDto.status === ReportStatus.HID) {
      req.message = 'message.report.hidden_success';
    } else {
      req.message = 'message.report.ignored_success';
    }

    return this._reportContentService.updateStatusReport(user, updateStatusReportDto);
  }
}
