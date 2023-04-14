import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { APP_VERSION } from '../../common/constants';
import { ResponseMessages } from '../../common/decorators';
import { InjectUserToBody } from '../../common/decorators/inject.decorator';
import { PageDto } from '../../common/dto';
import { AuthUser } from '../auth';
import { PostAppService } from './application/post.app-service';
import { CreatePostDto, GetPostDto, GetPostEditedHistoryDto, UpdatePostDto } from './dto/requests';
import { GetDraftPostDto } from './dto/requests/get-draft-posts.dto';
import { PostEditedHistoryDto, PostResponseDto } from './dto/responses';
import { GetPostPipe } from './pipes';
import { UserDto } from '../v2-user/application';
import { ContentRequireGroupException } from '../v2-post/exception/content-require-group.exception';

@ApiSecurity('authorization')
@ApiTags('Posts')
@Controller({
  version: APP_VERSION,
  path: 'posts',
})
export class PostController {
  public constructor(private _postAppService: PostAppService) {}

  @ApiOperation({ summary: 'Get post edited history' })
  @ApiOkResponse({
    type: PostEditedHistoryDto,
  })
  @Get('/:postId/edited-history')
  public getEditedHistory(
    @AuthUser() user: UserDto,
    @Param('postId', ParseUUIDPipe) postId: string,
    @Query() getPostEditedHistoryDto: GetPostEditedHistoryDto
  ): Promise<PageDto<PostEditedHistoryDto>> {
    return this._postAppService.getEditedHistory(user, postId, getPostEditedHistoryDto);
  }

  @ApiOperation({ summary: 'Get draft posts' })
  @ApiOkResponse({
    type: PostResponseDto,
  })
  @Get('/draft')
  public getDrafts(
    @AuthUser() user: UserDto,
    @Query() getDraftPostDto: GetDraftPostDto
  ): Promise<PageDto<PostResponseDto>> {
    return this._postAppService.getDraftPosts(user, getDraftPostDto);
  }

  @ApiOperation({ summary: 'Get total draft posts' })
  @ApiOkResponse({
    type: Number,
  })
  @Get('/total-draft')
  public async getTotalDraft(@AuthUser() user: UserDto): Promise<any> {
    return this._postAppService.getTotalDraft(user);
  }

  @ApiOperation({ summary: 'Get post detail' })
  @ApiOkResponse({
    type: PostResponseDto,
  })
  @Get('/:postId')
  public async get(
    @AuthUser(false) user: UserDto,
    @Param('postId', ParseUUIDPipe) postId: string,
    @Query(GetPostPipe) getPostDto: GetPostDto
  ): Promise<PostResponseDto> {
    try {
      const post = await this._postAppService.getPost(user, postId, getPostDto);
      return post;
    } catch (e) {
      switch (e.constructor) {
        case ContentRequireGroupException:
          throw new ForbiddenException(e);
        default:
          throw e;
      }
    }
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
    return this._postAppService.createPost(user, createPostDto);
  }

  @ApiOperation({ summary: 'Update post' })
  @ApiOkResponse({
    type: PostResponseDto,
    description: 'Update post successfully',
  })
  @ResponseMessages({ success: 'Post has been published successfully' })
  @Put('/:postId')
  @InjectUserToBody()
  public async update(
    @AuthUser() user: UserDto,
    @Param('postId', ParseUUIDPipe) postId: string,
    @Body() updatePostDto: UpdatePostDto
  ): Promise<PostResponseDto> {
    return this._postAppService.updatePost(user, postId, updatePostDto);
  }

  @ApiOperation({ summary: 'Publish post' })
  @ApiOkResponse({
    type: PostResponseDto,
    description: 'Publish post successfully',
  })
  @Put('/:postId/publish')
  public async publish(
    @AuthUser() user: UserDto,
    @Param('postId', ParseUUIDPipe) postId: string
  ): Promise<PostResponseDto> {
    return this._postAppService.publishPost(user, postId);
  }

  @ApiOperation({ summary: 'Delete post' })
  @ApiOkResponse({
    type: Boolean,
    description: 'Delete post successfully',
  })
  @Delete('/:id')
  public async delete(
    @AuthUser() user: UserDto,
    @Param('id', ParseUUIDPipe) postId: string
  ): Promise<boolean> {
    return this._postAppService.deletePost(user, postId);
  }

  @ApiOperation({ summary: 'Mark as read' })
  @ApiOkResponse({
    type: Boolean,
  })
  @Put('/:id/mark-as-read')
  public async markRead(
    @AuthUser() user: UserDto,
    @Param('id', ParseUUIDPipe) postId: string
  ): Promise<boolean> {
    return this._postAppService.markReadPost(user, postId);
  }

  @Get('/get-user-group/:groupId/:userId/:postId')
  public async getUserGroup(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('postId', ParseUUIDPipe) postId: string
  ): Promise<any> {
    return this._postAppService.getUserGroup(groupId, userId, postId);
  }

  @ApiOperation({ summary: 'Save post' })
  @ApiOkResponse({
    type: Boolean,
  })
  @Post('/:postId/save')
  public async save(
    @AuthUser() user: UserDto,
    @Param('postId', ParseUUIDPipe) postId: string
  ): Promise<boolean> {
    return this._postAppService.savePost(user, postId);
  }

  @ApiOperation({ summary: 'unsave post' })
  @ApiOkResponse({
    type: Boolean,
  })
  @Delete('/:postId/unsave')
  public async unSave(
    @AuthUser() user: UserDto,
    @Param('postId', ParseUUIDPipe) postId: string
  ): Promise<boolean> {
    return this._postAppService.unSavePost(user, postId);
  }
}
