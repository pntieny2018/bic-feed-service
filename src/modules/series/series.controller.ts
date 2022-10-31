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
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { APP_VERSION } from '../../common/constants';
import { InjectUserToBody } from '../../common/decorators/inject.decorator';
import { PageDto } from '../../common/dto';
import { AuthUser, UserDto } from '../auth';
import { WebhookGuard } from '../auth/webhook.guard';
import { PostAppService } from './application/series.app-service';
import {
  CreateFastlaneDto,
  CreatePostDto,
  GetPostDto,
  GetPostEditedHistoryDto,
  SearchPostsDto,
  UpdatePostDto,
} from './dto/requests';
import { GetDraftPostDto } from './dto/requests/get-draft-posts.dto';
import { PostEditedHistoryDto, PostResponseDto } from './dto/responses';
import { GetPostPipe } from './pipes';

@ApiSecurity('authorization')
@ApiTags('Posts')
@Controller({
  version: APP_VERSION,
  path: 'posts',
})
export class SeriesController {
  public constructor(private _postAppService: PostAppService) {}

  @ApiOperation({ summary: 'Get post detail' })
  @ApiOkResponse({
    type: PostResponseDto,
  })
  @Get('/:id')
  public async get(
    @AuthUser(false) user: UserDto,
    @Param('id', ParseUUIDPipe) id: string,
    @Query(GetPostPipe) getPostDto: GetPostDto
  ): Promise<PostResponseDto> {
    return this._postAppService.getSeries(user, id, getPostDto);
  }

  @ApiOperation({ summary: 'Create post' })
  @ApiOkResponse({
    type: PostResponseDto,
    description: 'Create post successfully',
  })
  @Post('/')
  @InjectUserToBody()
  public async create(
    @AuthUser() user: UserDto,
    @Body() createPostDto: CreatePostDto
  ): Promise<any> {
    return this._postAppService.createSeries(user, createPostDto);
  }

  @ApiOperation({ summary: 'Update post' })
  @ApiOkResponse({
    type: PostResponseDto,
    description: 'Update post successfully',
  })
  @Put('/:id')
  @InjectUserToBody()
  public async update(
    @AuthUser() user: UserDto,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePostDto: UpdatePostDto
  ): Promise<PostResponseDto> {
    return this._postAppService.updateSeries(user, id, updatePostDto);
  }

  @ApiOperation({ summary: 'Delete post' })
  @ApiOkResponse({
    type: Boolean,
    description: 'Delete post successfully',
  })
  @Delete('/:id')
  public async delete(
    @AuthUser() user: UserDto,
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<boolean> {
    return this._postAppService.deleteSeries(user, id);
  }
}
