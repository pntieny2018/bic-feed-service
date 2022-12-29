import { ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { APP_VERSION } from '../../../../common/constants';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreatetagCommand } from '../../application/command/create-tag/create-tag.command';
import { TagResponseDto } from '../dto/response';
import { AuthUser, UserDto } from '../../../auth';
import { ResponseMessages } from '../../../../common/decorators';
import { ClassTransformer } from 'class-transformer';
import { CreateTagDto } from '../dto/request/tag/create-tag.dto';
import { UpdateTagDto } from '../../../tag/dto/requests/update-tag.dto';
import { UpdatetagCommand } from '../../application/command/update-tag/update-tag.command';
import { DeleteTagCommand } from '../../application/command/delete-tag/delete-tag.command';
import { FindTagsPaginationQuery } from '../../application/query/find-tags/find-tags-pagination.query';
import { PageDto } from '../../../../common/dto';
import { GetTagDto } from '../dto/request/tag/get-tag.dto';

@ApiTags('Tags')
@ApiSecurity('authorization')
@Controller({
  version: APP_VERSION,
  path: 'tags',
})
export class TagController {
  public constructor(
    @Inject() private readonly _commandBus: CommandBus,
    @Inject() private readonly _queryBus: QueryBus
  ) {}
  private _classTransformer = new ClassTransformer();
  @ApiOperation({ summary: 'Get tags' })
  @ApiOkResponse({
    type: TagResponseDto,
    description: 'Get tag successfully',
  })
  @ResponseMessages({
    success: 'Get tag successfully',
  })
  @Get('/')
  public async get(
    @AuthUser() _user: UserDto,
    @Query() getTagDto: GetTagDto
  ): Promise<PageDto<TagResponseDto>> {
    const { groupIds, name, offset, limit } = getTagDto;
    const { rows, total } = await this._queryBus.execute(
      new FindTagsPaginationQuery({ name, groupIds, offset, limit })
    );

    const tags = rows.map((row) => this._classTransformer.plainToInstance(TagResponseDto, row));

    return new PageDto<TagResponseDto>(tags, {
      total,
      limit: getTagDto.limit,
      offset: getTagDto.offset,
    });
  }

  @ApiOperation({ summary: 'Create new tag' })
  @ApiOkResponse({
    type: TagResponseDto,
    description: 'Create tag successfully',
  })
  @ResponseMessages({
    success: 'Tag was created successfully',
  })
  @Post('/')
  public async create(
    @AuthUser() user: UserDto,
    @Body() createTagDto: CreateTagDto
  ): Promise<TagResponseDto> {
    const { groupId, name } = createTagDto;
    const userId = user.id;
    const tag = this._commandBus.execute(new CreatetagCommand({ groupId, name, userId }));
    console.log('111111111');
    return this._classTransformer.plainToInstance(TagResponseDto, tag);
  }

  @ApiOperation({ summary: 'Update tag' })
  @ApiOkResponse({
    type: TagResponseDto,
    description: 'Update tag successfully',
  })
  @ResponseMessages({ success: 'Tag updated' })
  @Put('/:id')
  public async update(
    @AuthUser() user: UserDto,
    @Param('id', ParseUUIDPipe) tagId: string,
    @Body() updateTagDto: UpdateTagDto
  ): Promise<void> {
    const { name } = updateTagDto;
    return this._commandBus.execute(new UpdatetagCommand({ id: tagId, name, userId: user.id }));
  }

  @ApiOperation({ summary: 'Delete tag' })
  @ApiOkResponse({
    type: Boolean,
    description: 'Delete tag successfully',
  })
  @Delete('/:id')
  @ResponseMessages({ success: 'Tag deleted' })
  public async delete(
    @AuthUser() user: UserDto,
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<void> {
    await this._commandBus.execute(new DeleteTagCommand({ id, userId: user.id }));
  }
}
