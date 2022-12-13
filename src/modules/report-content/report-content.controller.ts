import { GetReportDto, StatisticsReportResponsesDto } from './dto';
import { AuthUser, UserDto } from '../auth';
import { CreateReportDto, UpdateStatusReportDto } from './dto';
import { ReportContentService } from './report-content.service';
import { Body, Controller, Post, Patch, Get, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';

@ApiSecurity('authorization')
@ApiTags('Reports')
@Controller('reports')
export class ReportContentController {
  public constructor(private readonly _reportContentService: ReportContentService) {}

  @Get('/content')
  public async getContentsReported(
    @AuthUser() user: UserDto,
    @Body() getReportDto: GetReportDto
  ): Promise<boolean> {
    // TODO check permission
    return this._reportContentService.getReports(getReportDto);
  }

  @Get('/me/content')
  public async getContentsBlockedOfMe(
    @AuthUser() user: UserDto,
    @Body() getReportDto: GetReportDto
  ): Promise<any> {
    getReportDto.authorId = user.id;
    return this._reportContentService.getReports(getReportDto);
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
    return this._reportContentService.report(user, createReportDto);
  }

  @Patch('/content')
  public async update(
    @AuthUser() user: UserDto,
    @Body() updateStatusReportDto: UpdateStatusReportDto
  ): Promise<any> {
    return this._reportContentService.update(user, updateStatusReportDto);
  }
}
