import { GetReportDto } from './dto';
import { AuthUser, UserDto } from '../auth';
import { CreateReportDto, UpdateStatusReportDto } from './dto';
import { ReportContentService } from './report-content.service';
import { Body, Controller, Post, Patch, Get } from '@nestjs/common';

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
