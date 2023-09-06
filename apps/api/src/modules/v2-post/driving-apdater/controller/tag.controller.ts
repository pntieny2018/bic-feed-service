import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Version,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { ResponseMessages } from '../../../../common/decorators';
import { PageDto } from '../../../../common/dto';
import { AuthUser } from '../../../auth';
import { CreateTagDto } from '../../../tag/dto/requests/create-tag.dto';
import { UserDto } from '../../../v2-user/application';
import { CreateTagCommand } from '../../application/command/create-tag/create-tag.command';
import { DeleteTagCommand } from '../../application/command/delete-tag/delete-tag.command';
import { UpdateTagCommand } from '../../application/command/update-tag/update-tag.command';
import { FindTagsPaginationQuery } from '../../application/query/find-tags/find-tags-pagination.query';
import {
  TagDuplicateNameException,
  TagNoCreatePermissionException,
  TagNoDeletePermissionException,
  TagNotFoundException,
  TagNoUpdatePermissionException,
  TagUsedException,
} from '../../domain/exception';
import {
  CreateTagRequestDto,
  GetTagRequestDto,
  SearchTagRequestDto,
  UpdateTagRequestDto,
} from '../dto/request';
import { DomainModelException } from '../../../../common/exceptions/domain-model.exception';
import { FindTagsPaginationDto } from '../../application/query/find-tags/find-tags-pagination.dto';
import { TagDto } from '../../application/dto';
import { ROUTES } from '../../../../common/constants/routes.constant';
import { SearchTagsDto } from '../../application/query/search-tags/search-tags.dto';
import { SearchTagsQuery } from '../../application/query/search-tags/search-tags.query';

@ApiTags('Tags')
@ApiSecurity('authorization')
@Controller()
export class TagController {
  public constructor(
    private readonly _commandBus: CommandBus,
    private readonly _queryBus: QueryBus
  ) {}

  @ApiOperation({ summary: 'Search and group tags' })
  @ApiOkResponse({
    type: SearchTagsDto,
    description: 'Search and group tags successfully',
  })
  @Get(ROUTES.TAG.SEARCH_TAGS.PATH)
  public async searchAndGroup(
    @AuthUser() _user: UserDto,
    @Query() searchTagDto: SearchTagRequestDto
  ): Promise<SearchTagsDto> {
    const { keyword } = searchTagDto;
    return this._queryBus.execute(new SearchTagsQuery({ keyword }));
  }

  @ApiOperation({ summary: 'Get tags' })
  @Get(ROUTES.TAG.GET_TAGS.PATH)
  public async get(
    @AuthUser() _user: UserDto,
    @Query() getTagDto: GetTagRequestDto
  ): Promise<PageDto<FindTagsPaginationDto>> {
    const { groupIds, name, offset, limit } = getTagDto;
    const { rows, total } = await this._queryBus.execute(
      new FindTagsPaginationQuery({ name, groupIds, offset, limit })
    );

    return new PageDto<FindTagsPaginationDto>(rows, {
      total,
      limit: getTagDto.limit,
      offset: getTagDto.offset,
    });
  }

  @ApiOperation({ summary: 'Create new tag' })
  @ApiOkResponse({
    type: CreateTagDto,
    description: 'Create tag successfully',
  })
  @ResponseMessages({
    success: 'message.tag.created_success',
  })
  @Post(ROUTES.TAG.CREATE_TAG.PATH)
  @Version(ROUTES.TAG.CREATE_TAG.VERSIONS)
  public async create(
    @AuthUser() user: UserDto,
    @Body() createTagDto: CreateTagRequestDto
  ): Promise<CreateTagDto> {
    const { groupId, name } = createTagDto;
    const userId = user.id;
    try {
      const tag = await this._commandBus.execute<CreateTagCommand, CreateTagDto>(
        new CreateTagCommand({ groupId, name, userId })
      );

      return tag;
    } catch (e) {
      switch (e.constructor) {
        case TagNotFoundException:
          throw new NotFoundException(e);
        case TagDuplicateNameException:
          throw new BadRequestException(e);
        case TagNoCreatePermissionException:
          throw new ForbiddenException(e);
        case DomainModelException:
          throw new BadRequestException(e);
        default:
          throw e;
      }
    }
  }

  @ApiOperation({ summary: 'Update tag' })
  @ApiOkResponse({
    type: TagDto,
    description: 'Update tag successfully',
  })
  @ResponseMessages({ success: 'message.tag.updated_success' })
  @Put(ROUTES.TAG.UPDATE_TAG.PATH)
  @Version(ROUTES.TAG.UPDATE_TAG.VERSIONS)
  public async update(
    @AuthUser() user: UserDto,
    @Param('id', ParseUUIDPipe) tagId: string,
    @Body() updateTagDto: UpdateTagRequestDto
  ): Promise<TagDto> {
    const { name } = updateTagDto;
    try {
      const tag = await this._commandBus.execute<UpdateTagCommand, TagDto>(
        new UpdateTagCommand({ id: tagId, name, userId: user.id })
      );
      return tag;
    } catch (e) {
      switch (e.constructor) {
        case TagNotFoundException:
          throw new NotFoundException(e);
        case TagDuplicateNameException:
        case TagUsedException:
          throw new BadRequestException(e);
        case TagNoUpdatePermissionException:
          throw new ForbiddenException(e);
        case DomainModelException:
          throw new BadRequestException(e);
        default:
          throw e;
      }
    }
  }

  @ApiOperation({ summary: 'Delete tag' })
  @ApiOkResponse({
    type: Boolean,
    description: 'Delete tag successfully',
  })
  @Delete(ROUTES.TAG.DELETE_TAG.PATH)
  @Version(ROUTES.TAG.DELETE_TAG.VERSIONS)
  @ResponseMessages({ success: 'message.tag.deleted_success' })
  public async delete(
    @AuthUser() user: UserDto,
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<void> {
    try {
      await this._commandBus.execute(new DeleteTagCommand({ id, userId: user.id }));
    } catch (e) {
      switch (e.constructor) {
        case TagNotFoundException:
          throw new BadRequestException(e);
        case TagUsedException:
          throw new BadRequestException(e);
        case TagNoDeletePermissionException:
          throw new ForbiddenException(e);
        case DomainModelException:
          throw new BadRequestException(e);
        default:
          throw e;
      }
    }
  }
}
