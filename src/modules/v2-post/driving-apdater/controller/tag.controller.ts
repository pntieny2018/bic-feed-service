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
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { ClassTransformer } from 'class-transformer';
import { APP_VERSION } from '../../../../common/constants';
import { ResponseMessages } from '../../../../common/decorators';
import { PageDto } from '../../../../common/dto';
import { AuthUser } from '../../../auth';
import { CreateTagDto } from '../../../tag/dto/requests/create-tag.dto';
import { UserDto } from '../../../v2-user/application';
import { CreateTagCommand } from '../../application/command/create-tag/create-tag.command';
import { DeleteTagCommand } from '../../application/command/delete-tag/delete-tag.command';
import { UpdateTagCommand } from '../../application/command/update-tag/update-tag.command';
import { UpdateTagDto } from '../../application/command/update-tag/update-tag.dto';
import { FindTagsPaginationQuery } from '../../application/query/find-tags/find-tags-pagination.query';
import { TagDuplicateNameException, TagNotFoundException, TagUsedException } from '../../exception';
import { CreateTagRequestDto, GetTagRequestDto, UpdateTagRequestDto } from '../dto/request/tag';
import { TagResponseDto } from '../dto/response';
import { TagNoCreatePermissionException } from '../../exception/tag-no-create-permission.exception';
import { TagNoUpdatePermissionException } from '../../exception/tag-no-update-permission.exception';
import { TagNoDeletePermissionException } from '../../exception/tag-no-delete-permission.exception';

@ApiTags('Tags')
@ApiSecurity('authorization')
@Controller({
  version: APP_VERSION,
  path: 'tags',
})
export class TagController {
  public constructor(
    private readonly _commandBus: CommandBus,
    private readonly _queryBus: QueryBus
  ) {}
  private _classTransformer = new ClassTransformer();
  @ApiOperation({ summary: 'Get tags' })
  @ApiOkResponse({ type: TagResponseDto })
  @Get('/')
  public async get(
    @AuthUser() _user: UserDto,
    @Query() getTagDto: GetTagRequestDto
  ): Promise<PageDto<TagResponseDto>> {
    const { groupIds, name, offset, limit } = getTagDto;
    const { rows, total } = await this._queryBus.execute(
      new FindTagsPaginationQuery({ name, groupIds, offset, limit })
    );

    const tags = rows.map((row) =>
      this._classTransformer.plainToInstance(TagResponseDto, row, {
        excludeExtraneousValues: true,
      })
    );

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
    success: 'message.tag.created_success',
  })
  @Post('/')
  public async create(
    @AuthUser() user: UserDto,
    @Body() createTagDto: CreateTagRequestDto
  ): Promise<TagResponseDto> {
    const { groupId, name } = createTagDto;
    const userId = user.id;
    try {
      const tag = await this._commandBus.execute<CreateTagCommand, CreateTagDto>(
        new CreateTagCommand({ groupId, name, userId })
      );
      const a = this._classTransformer.plainToInstance(TagResponseDto, tag, {
        excludeExtraneousValues: true,
      });

      return a;
    } catch (e) {
      switch (e.constructor) {
        case TagNotFoundException:
          throw new NotFoundException(e);
        case TagDuplicateNameException:
          throw new BadRequestException(e);
        case TagNoCreatePermissionException:
          throw new ForbiddenException(e);
        default:
          throw e;
      }
    }
  }

  @ApiOperation({ summary: 'Update tag' })
  @ApiOkResponse({
    type: TagResponseDto,
    description: 'Update tag successfully',
  })
  @ResponseMessages({ success: 'message.tag.updated_success' })
  @Put('/:id')
  public async update(
    @AuthUser() user: UserDto,
    @Param('id', ParseUUIDPipe) tagId: string,
    @Body() updateTagDto: UpdateTagRequestDto
  ): Promise<TagResponseDto> {
    const { name } = updateTagDto;
    try {
      const tag = await this._commandBus.execute<UpdateTagCommand, UpdateTagDto>(
        new UpdateTagCommand({ id: tagId, name, userId: user.id })
      );
      return this._classTransformer.plainToInstance(TagResponseDto, tag, {
        excludeExtraneousValues: true,
      });
    } catch (e) {
      switch (e.constructor) {
        case TagNotFoundException:
          throw new NotFoundException(e);
        case TagDuplicateNameException:
        case TagUsedException:
          throw new BadRequestException(e);
        case TagNoUpdatePermissionException:
          throw new ForbiddenException(e);
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
  @Delete('/:id')
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
        default:
          throw e;
      }
    }
  }
}
