import {
  BadRequestException,
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { AuthUser } from '../../../auth';
import { UserDto } from '../../../v2-user/application';
import { VERSIONS_SUPPORTED } from '../../../../common/constants';
import { MarkReadImportantContentCommand } from '../../application/command/mark-read-important-content/mark-read-important-content.command';
import { ValidateSeriesTagsCommand } from '../../application/command/validate-series-tags/validate-series-tag.command';
import { ValidateSeriesTagDto } from '../dto/request';
import { TagSeriesInvalidException } from '../../domain/exception/tag-series-invalid.exception';

@ApiTags('v2 Content')
@ApiSecurity('authorization')
@Controller({
  path: 'content',
  version: VERSIONS_SUPPORTED,
})
export class ContentController {
  public constructor(
    private readonly _commandBus: CommandBus,
    private readonly _queryBus: QueryBus
  ) {}

  @ApiOperation({ summary: 'Mark as read' })
  @ApiOkResponse({
    type: Boolean,
  })
  @Put('/:id/mark-as-read')
  public async markRead(
    @AuthUser() authUser: UserDto,
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<void> {
    await this._commandBus.execute<MarkReadImportantContentCommand, void>(
      new MarkReadImportantContentCommand({ id, authUser })
    );
  }

  @ApiOperation({ summary: 'Validate series and tags' })
  @ApiOkResponse({
    type: Boolean,
    description: 'Validate article series and tags successfully',
  })
  @Post('/validate-series-tags')
  public async validateSeriesTags(
    @AuthUser() authUser: UserDto,
    @Body() validateSeriesTagDto: ValidateSeriesTagDto
  ): Promise<void> {
    try {
      await this._commandBus.execute<ValidateSeriesTagsCommand, void>(
        new ValidateSeriesTagsCommand({
          groupIds: validateSeriesTagDto.groups,
          seriesIds: validateSeriesTagDto.series,
          tagIds: validateSeriesTagDto.tags,
        })
      );
    } catch (e) {
      switch (e.constructor) {
        case TagSeriesInvalidException:
          throw new BadRequestException(e);
        default:
          throw e;
      }
    }
  }
}
