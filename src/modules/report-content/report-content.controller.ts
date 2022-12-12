import { AuthUser, UserDto } from '../auth';
import { CreateReportDto, UpdateStatusReportDto } from './dto';
import { ReportContentService } from './report-content.service';
import { Body, Controller, Param, Post, Patch, Get } from '@nestjs/common';

@Controller('reports')
export class ReportContentController {
  public constructor(private readonly _reportContentService: ReportContentService) {}

  @Get('/')
  public async getContentsReported(
    @AuthUser() user: UserDto,
    @Body() createReportDto: CreateReportDto
  ): Promise<boolean> {
    return this._reportContentService.report(user, createReportDto);
  }

  @Get('/me')
  public async getContentsBlockedOfMe(
    @AuthUser() user: UserDto,
    @Body() createReportDto: CreateReportDto
  ): Promise<any> {
    return this._reportContentService.report(user, createReportDto);
  }

  @Post()
  public async report(
    @AuthUser() user: UserDto,
    @Body() createReportDto: CreateReportDto
  ): Promise<any> {
    return this._reportContentService.report(user, createReportDto);
  }

  @Patch('/:id')
  public async update(
    @AuthUser() user: UserDto,
    @Param('id') reportId: string,
    @Body() updateStatusReportDto: UpdateStatusReportDto
  ): Promise<any> {
    return this._reportContentService.update(user, updateStatusReportDto);
  }
}
