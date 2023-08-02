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
import { ClassTransformer } from 'class-transformer';
import { AuthUser, ResponseMessages } from '../../../../common/decorators';
import { PageDto } from '../../../../common/dto';
import { CreateTagDto } from '../../../tag/dto/requests/create-tag.dto';
import { UserDto } from '../../../v2-user/application';
import { CreateTagCommand } from '../../application/command/create-tag/create-tag.command';
import { DeleteTagCommand } from '../../application/command/delete-tag/delete-tag.command';
import { UpdateTagCommand } from '../../application/command/update-tag/update-tag.command';
import { FindTagsPaginationQuery } from '../../application/query/find-tags/find-tags-pagination.query';

import { CreateTagRequestDto, GetTagRequestDto, UpdateTagRequestDto } from '../dto/request';
import { FindTagsPaginationDto } from '../../application/query/find-tags/find-tags-pagination.dto';
import { TagDto } from '../../application/dto';
import { ROUTES } from '../../../../common/constants/routes.constant';

@ApiTags('Tags')
@ApiSecurity('authorization')
@Controller()
export class TagController {
  public constructor(
    private readonly _commandBus: CommandBus,
    private readonly _queryBus: QueryBus
  ) {}
  private _classTransformer = new ClassTransformer();
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

    const tag = await this._commandBus.execute<CreateTagCommand, CreateTagDto>(
      new CreateTagCommand({ groupId, name, userId })
    );

    return tag;
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
