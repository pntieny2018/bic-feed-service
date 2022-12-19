import { AuthUser, UserDto } from '../auth';
import { ApiParam, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { CreateReportDto, GetBlockedContentOfMeDto, UpdateStatusReportDto } from './dto';
import { ReportContentService } from './report-content.service';
import { GetReportDto, ReportReviewResponsesDto, StatisticsReportResponsesDto } from './dto';
import { Body, Controller, Post, Patch, Get, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { DetailContentReportResponseDto } from './dto/detail-content-report.response.dto';

@ApiTags('Reports')
@Controller('reports')
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
    return this._reportContentService.getContentBlockedOfMe(user, getOptions);
  }

  @ApiParam({
    name: 'id',
    description: 'Target id',
  })
  @Get('/:id/content')
  public async getDetailReportContent(
    @AuthUser() user: UserDto,
    @Param('id', ParseUUIDPipe) targetId: string
  ): Promise<DetailContentReportResponseDto> {
    // TODO check permission
    return this._reportContentService.getContent(user, targetId);
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
    @Query('count_reporter') countReporter = 5
  ): Promise<StatisticsReportResponsesDto> {
    // TODO check permission
    return this._reportContentService.getStatistics(user, reportId, targetId, countReporter);
  }

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
    @Body() updateStatusReportDto: UpdateStatusReportDto
  ): Promise<boolean> {
    // TODO check permission
    return this._reportContentService.updateStatusReport(user, updateStatusReportDto);
  }
}
