import { AuthUser, UserDto } from '../auth';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { CreateReportDto, UpdateStatusReportDto } from './dto';
import { ReportContentService } from './report-content.service';
import { GetReportDto, ReportReviewResponsesDto, StatisticsReportResponsesDto } from './dto';
import { Body, Controller, Post, Patch, Get, Param, Query, ParseUUIDPipe } from '@nestjs/common';

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
    return this._reportContentService.getReports(getReportDto);
  }

  @Get('/me/content')
  public async getContentsBlockedOfMe(@AuthUser() user: UserDto): Promise<any> {
    return this._reportContentService.getContentBlockedOfMe(user);
  }

  @Get('/:id/content')
  public async getDetailReportContent(@AuthUser() user: UserDto): Promise<any> {
    // TODO check permission
  }

  @Get(':id/statistics')
  public async getStatistics(
    @AuthUser() user: UserDto,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('count_reporter') countReporter = 5
  ): Promise<StatisticsReportResponsesDto> {
    // TODO check permission
    return this._reportContentService.getStatistics(id, countReporter);
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
