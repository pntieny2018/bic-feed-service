import { ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { APP_VERSION } from '../../common/constants';
import { TagService } from './tag.service';
import { ResponseMessages } from '../../common/decorators';
import { AuthUser, UserDto } from '../auth';
import { PageDto } from '../../common/dto';
import { CreateTagDto } from './dto/requests/create-tag.dto';
import { TagResponseDto } from './dto/responses/tag-response.dto';
import { GetTagDto } from './dto/requests/get-tag.dto';
import { InjectUserToBody } from '../../common/decorators/inject.decorator';
import { UpdateTagDto } from './dto/requests/update-tag.dto';

@ApiTags('Tags')
@ApiSecurity('authorization')
@Controller({
  version: APP_VERSION,
  path: 'tags_old',
})
export class TagController {
  public constructor(private _tagService: TagService) {}

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
    return this._tagService.get(getTagDto);
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
    @AuthUser() _user: UserDto,
    @Body() createTagDto: CreateTagDto
  ): Promise<TagResponseDto> {
    return this._tagService.create(createTagDto, _user);
  }

  @ApiOperation({ summary: 'Update tag' })
  @ApiOkResponse({
    type: TagResponseDto,
    description: 'Update tag successfully',
  })
  @ResponseMessages({ success: 'Tag updated' })
  @Put('/:id')
  @InjectUserToBody()
  public async update(
    @AuthUser() user: UserDto,
    @Param('id', ParseUUIDPipe) tagId: string,
    @Body() updateTagDto: UpdateTagDto
  ): Promise<TagResponseDto> {
    return this._tagService.update(tagId, updateTagDto, user);
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
    @Param('id', ParseUUIDPipe) tagId: string
  ): Promise<boolean> {
    return this._tagService.delete(tagId, user);
  }
}
