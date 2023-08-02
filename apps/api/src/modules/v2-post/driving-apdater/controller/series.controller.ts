import { AuthUser } from '../../../auth';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Delete,
  Version,
  Query,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { ResponseMessages } from '../../../../common/decorators';
import { UserDto } from '../../../v2-user/application';
import { TRANSFORMER_VISIBLE_ONLY } from '../../../../common/constants';
import { CreateSeriesRequestDto } from '../dto/request';
import { CreateSeriesDto } from '../../application/command/create-series/create-series.dto';
import {
  CreateSeriesCommand,
  CreateSeriesCommandPayload,
} from '../../application/command/create-series/create-series.command';
import { CreateCommentDto } from '../../application/command/create-comment/create-comment.dto';
import {
  ContentAccessDeniedException,
  ContentEmptyGroupException,
  ContentNoCRUDPermissionAtGroupException,
  ContentNoCRUDPermissionException,
  ContentNoEditSettingPermissionAtGroupException,
  ContentNotFoundException,
  ContentRequireGroupException,
  InvalidResourceImageException,
  SeriesRequiredCoverException,
} from '../../domain/exception';
import { DomainModelException } from '../../../../common/exceptions/domain-model.exception';
import { instanceToInstance, plainToInstance } from 'class-transformer';
import { UpdateSeriesRequestDto } from '../dto/request/update-series.request.dto';
import {
  UpdateSeriesCommand,
  UpdateSeriesCommandPayload,
} from '../../application/command/update-series/update-series.command';
import { SeriesDto } from '../../application/dto';
import { FindSeriesQuery } from '../../application/query/find-series/find-series.query';
import {
  DeleteSeriesCommand,
  DeleteSeriesCommandPayload,
} from '../../application/command/delete-series/delete-series.command';
import { ROUTES } from '../../../../common/constants/routes.constant';
import { GetItemsBySeriesRequestDto } from '../dto/request/get-items-by-series.request.dto';
import { FindItemsBySeriesQuery } from '../../application/query/find-items-by-series/find-items-by-series.query';
import { FindItemsBySeriesDto } from '../../application/query/find-items-by-series/find-items-by-series.dto';

@ApiTags('Series v2')
@ApiSecurity('authorization')
@Controller()
export class SeriesController {
  public constructor(
    private readonly _commandBus: CommandBus,
    private readonly _queryBus: QueryBus
  ) {}

  @ApiOperation({ summary: 'Create new series' })
  @ApiOkResponse({
    type: CreateSeriesDto,
    description: 'Create series successfully',
  })
  @ResponseMessages({
    success: 'message.series.created_success',
  })
  @Post(ROUTES.SERIES.CREATE.PATH)
  @Version(ROUTES.SERIES.CREATE.VERSIONS)
  public async create(
    @AuthUser() user: UserDto,
    @Body() createSeriesRequestDto: CreateSeriesRequestDto
  ): Promise<CreateCommentDto> {
    try {
      const data = await this._commandBus.execute<CreateSeriesCommand, CreateCommentDto>(
        new CreateSeriesCommand({
          ...createSeriesRequestDto,
          actor: user,
          groupIds: createSeriesRequestDto.audience?.groupIds,
        } as CreateSeriesCommandPayload)
      );
      return instanceToInstance(data, { groups: [TRANSFORMER_VISIBLE_ONLY.PUBLIC] });
    } catch (e) {
      switch (e.constructor) {
        case ContentNotFoundException:
          throw new NotFoundException(e);
        case ContentEmptyGroupException:
        case SeriesRequiredCoverException:
        case InvalidResourceImageException:
        case DomainModelException:
          throw new BadRequestException(e);
        case ContentAccessDeniedException:
        case ContentNoCRUDPermissionAtGroupException:
        case ContentNoEditSettingPermissionAtGroupException:
          throw new ForbiddenException(e);
        default:
          throw e;
      }
    }
  }

  @ApiOperation({ summary: 'Update series' })
  @ApiOkResponse({
    description: 'Update series successfully',
  })
  @ResponseMessages({
    success: 'message.series.updated_success',
  })
  @Put(ROUTES.SERIES.UPDATE.PATH)
  @Version(ROUTES.SERIES.UPDATE.VERSIONS)
  public async update(
    @AuthUser() user: UserDto,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateSeriesRequestDto: UpdateSeriesRequestDto
  ): Promise<SeriesDto> {
    try {
      const data = await this._commandBus.execute<UpdateSeriesCommand, SeriesDto>(
        new UpdateSeriesCommand({
          ...updateSeriesRequestDto,
          id,
          actor: user,
          groupIds: updateSeriesRequestDto.audience?.groupIds,
        } as UpdateSeriesCommandPayload)
      );
      return instanceToInstance(data, { groups: [TRANSFORMER_VISIBLE_ONLY.PUBLIC] });
    } catch (e) {
      switch (e.constructor) {
        case ContentNotFoundException:
          throw new NotFoundException(e);
        case ContentEmptyGroupException:
        case SeriesRequiredCoverException:
        case InvalidResourceImageException:
        case DomainModelException:
          throw new BadRequestException(e);
        case ContentAccessDeniedException:
        case ContentNoCRUDPermissionAtGroupException:
        case ContentNoEditSettingPermissionAtGroupException:
          throw new ForbiddenException(e);
        default:
          throw e;
      }
    }
  }

  @ApiOperation({ summary: 'Get items by series' })
  @Get(ROUTES.SERIES.GET_ITEMS_BY_SERIES.PATH)
  @Version(ROUTES.SERIES.GET_ITEMS_BY_SERIES.VERSIONS)
  public async getItemsBySeries(
    @AuthUser() authUser: UserDto,
    @Query() getItemsBySeriesRequestDto: GetItemsBySeriesRequestDto
  ): Promise<FindItemsBySeriesDto> {
    try {
      const result = await this._queryBus.execute<FindItemsBySeriesQuery, FindItemsBySeriesDto>(
        new FindItemsBySeriesQuery({
          seriesIds: getItemsBySeriesRequestDto.seriesIds,
          authUser,
        })
      );
      return plainToInstance(FindItemsBySeriesDto, result, {
        groups: [TRANSFORMER_VISIBLE_ONLY.PUBLIC],
      });
    } catch (e) {
      switch (e.constructor) {
        case DomainModelException:
          throw new BadRequestException(e);
        default:
          throw e;
      }
    }
  }

  @ApiOperation({ summary: 'Get series detail' })
  @Get(ROUTES.SERIES.GET_DETAIL.PATH)
  @Version(ROUTES.SERIES.GET_DETAIL.VERSIONS)
  public async getPostDetail(
    @Param('id', ParseUUIDPipe) id: string,
    @AuthUser() authUser: UserDto
  ): Promise<SeriesDto> {
    try {
      const data = await this._queryBus.execute(new FindSeriesQuery({ seriesId: id, authUser }));
      return plainToInstance(SeriesDto, data, { groups: [TRANSFORMER_VISIBLE_ONLY.PUBLIC] });
    } catch (e) {
      switch (e.constructor) {
        case ContentNotFoundException:
          throw new NotFoundException(e);
        case ContentRequireGroupException:
        case ContentNoCRUDPermissionException:
        case ContentAccessDeniedException:
          throw new ForbiddenException(e);
        case DomainModelException:
          throw new BadRequestException(e);
        default:
          throw e;
      }
    }
  }

  @ApiOperation({ summary: 'Delete series' })
  @ApiOkResponse({
    description: 'Delete series successfully',
  })
  @ResponseMessages({
    success: 'message.series.deleted_success',
  })
  @Delete(ROUTES.SERIES.DELETE.PATH)
  @Version(ROUTES.SERIES.DELETE.VERSIONS)
  public async delete(
    @AuthUser() user: UserDto,
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<void> {
    try {
      await this._commandBus.execute<DeleteSeriesCommand, void>(
        new DeleteSeriesCommand({
          id,
          actor: user,
        } as DeleteSeriesCommandPayload)
      );
    } catch (e) {
      switch (e.constructor) {
        case ContentNotFoundException:
          throw new NotFoundException(e);
        case DomainModelException:
          throw new BadRequestException(e);
        case ContentAccessDeniedException:
        case ContentNoCRUDPermissionException:
        case ContentNoCRUDPermissionAtGroupException:
        case ContentNoEditSettingPermissionAtGroupException:
          throw new ForbiddenException(e);
        default:
          throw e;
      }
    }
  }
}
