import { AuthUser } from '../../../auth';
import { CommandBus } from '@nestjs/cqrs';
import { BadRequestException, Body, Controller, ForbiddenException, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { ResponseMessages } from '../../../../common/decorators';
import { UserDto } from '../../../v2-user/application/user.dto';
import { DEFAULT_APP_VERSION } from '../../../../common/constants';
import { CreateSeriesRequestDto } from '../dto/request/create-series.request.dto';
import { CreateSeriesDto } from '../../application/command/create-series/create-series.dto';
import {
  CreateSeriesCommand,
  CreateSeriesCommandPayload,
} from '../../application/command/create-series/create-series.command';
import { CreateCommentDto } from '../../application/command/create-comment/create-comment.dto';
import {
  ContentEmptyGroupException,
  ContentNoCRUDPermissionAtGroupException,
  ContentNoEditSettingPermissionAtGroupException,
} from '../../domain/exception';
import { DomainModelException } from '../../../../common/exceptions/domain-model.exception';

@ApiTags('Series v2')
@ApiSecurity('authorization')
@Controller({
  version: DEFAULT_APP_VERSION,
  path: 'series',
})
export class SeriesController {
  public constructor(private readonly _commandBus: CommandBus) {}

  @ApiOperation({ summary: 'Create new series' })
  @ApiOkResponse({
    type: CreateSeriesDto,
    description: 'Create series successfully',
  })
  @ResponseMessages({
    success: 'message.series.created_success',
  })
  @Post('/')
  public async create(
    @AuthUser() user: UserDto,
    @Body() createSeriesRequestDto: CreateSeriesRequestDto
  ): Promise<CreateCommentDto> {
    try {
      const data = await this._commandBus.execute<CreateSeriesCommand, CreateCommentDto>(
        new CreateSeriesCommand({
          ...createSeriesRequestDto,
          actor: user,
        } as CreateSeriesCommandPayload)
      );
      return data;
    } catch (e) {
      switch (e.constructor) {
        case ContentEmptyGroupException:
        case ContentNoCRUDPermissionAtGroupException:
        case ContentNoEditSettingPermissionAtGroupException:
          throw new ForbiddenException(e);
        case DomainModelException:
          throw new BadRequestException(e);
        default:
          throw e;
      }
    }
  }
}
