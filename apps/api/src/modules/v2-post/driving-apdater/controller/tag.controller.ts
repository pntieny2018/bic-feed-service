import { UserDto } from '@libs/service/user';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Version,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';

import { ROUTES } from '../../../../common/constants/routes.constant';
import { AuthUser, ResponseMessages } from '../../../../common/decorators';
import { PageDto } from '../../../../common/dto';
import {
  CreateTagCommand,
  DeleteTagCommand,
  UpdateTagCommand,
} from '../../application/command/tag';
import { FindTagsPaginationDto, SearchTagsDto, TagDto } from '../../application/dto';
import { FindTagsPaginationQuery, SearchTagsQuery } from '../../application/query/tag';
import {
  CreateTagRequestDto,
  GetTagRequestDto,
  SearchTagRequestDto,
  UpdateTagRequestDto,
} from '../dto/request';

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
    type: TagDto,
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
  ): Promise<TagDto> {
    const { groupId, name } = createTagDto;
    const userId = user.id;

    return this._commandBus.execute<CreateTagCommand, TagDto>(
      new CreateTagCommand({ groupId, name, userId })
    );
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

    const tag = await this._commandBus.execute<UpdateTagCommand, TagDto>(
      new UpdateTagCommand({ id: tagId, name, userId: user.id })
    );
    return tag;
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
    await this._commandBus.execute(new DeleteTagCommand({ id, userId: user.id }));
  }
}
