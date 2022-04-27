import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { InternalEventEmitterService } from '../../app/custom/event-emitter';
import { APP_VERSION } from '../../common/constants';
import { PageDto } from '../../common/dto';
import {
  PostHasBeenDeletedEvent,
  PostHasBeenPublishedEvent,
  PostHasBeenUpdatedEvent,
} from '../../events/post';
import { AuthUser, UserDto } from '../auth';
import {
  CreatePostDto,
  GetPostDto,
  GetPostEditedHistoryDto,
  SearchPostsDto,
  UpdatePostDto,
} from './dto/requests';
import { GetDraftPostDto } from './dto/requests/get-draft-posts.dto';
import { PostEditedHistoryDto, PostResponseDto } from './dto/responses';
import { PostService } from './post.service';

@ApiSecurity('authorization')
@ApiTags('Posts')
@Controller({
  version: APP_VERSION,
  path: 'posts',
})
export class PostController {
  public constructor(
    private _postService: PostService,
    private _eventEmitter: InternalEventEmitterService
  ) {}

  @ApiOperation({ summary: 'Search posts' })
  @ApiOkResponse({
    type: PostResponseDto,
  })
  @Get('/')
  public searchPosts(
    @AuthUser() user: UserDto,
    @Query() searchPostsDto: SearchPostsDto
  ): Promise<PageDto<PostResponseDto>> {
    return this._postService.searchPosts(user, searchPostsDto);
  }

  @ApiOperation({ summary: 'Get post edited history' })
  @ApiOkResponse({
    type: PostEditedHistoryDto,
  })
  @Get('/:postId/edited-history')
  public getPostEditedHistory(
    @AuthUser() user: UserDto,
    @Param('postId', ParseIntPipe) postId: number,
    @Query() getPostEditedHistoryDto: GetPostEditedHistoryDto
  ): Promise<PageDto<PostEditedHistoryDto>> {
    return this._postService.getPostEditedHistory(user, postId, getPostEditedHistoryDto);
  }

  @ApiOperation({ summary: 'Get draft posts' })
  @ApiOkResponse({
    type: PostResponseDto,
  })
  @Get('/draft')
  public getDraftPosts(
    @AuthUser() user: UserDto,
    @Query() getDraftPostDto: GetDraftPostDto
  ): Promise<PageDto<PostResponseDto>> {
    return this._postService.getDraftPosts(user.id, getDraftPostDto);
  }

  @ApiOperation({ summary: 'Get post detail' })
  @ApiOkResponse({
    type: PostResponseDto,
  })
  @Get('/:postId')
  public getPost(
    @AuthUser() user: UserDto,
    @Param('postId', ParseIntPipe) postId: number,
    @Query() getPostDto: GetPostDto
  ): Promise<PostResponseDto> {
    return this._postService.getPost(postId, user, getPostDto);
  }

  @ApiOperation({ summary: 'Create post' })
  @ApiOkResponse({
    type: PostResponseDto,
    description: 'Create post successfully',
  })
  @Post('/')
  public async createPost(
    @AuthUser() user: UserDto,
    @Body() createPostDto: CreatePostDto
  ): Promise<PostResponseDto> {
    const created = await this._postService.createPost(user, createPostDto);
    if (created) {
      const postResponseDto = await this._postService.getPost(created.id, user, new GetPostDto());
      return postResponseDto;
    }
  }

  @ApiOperation({ summary: 'Update post' })
  @ApiOkResponse({
    type: PostResponseDto,
    description: 'Update post successfully',
  })
  @Put('/:postId')
  public async updatePost(
    @AuthUser() user: UserDto,
    @Param('postId', ParseIntPipe) postId: number,
    @Body() createPostDto: UpdatePostDto
  ): Promise<PostResponseDto> {
    const postBefore = await this._postService.getPost(postId, user, new GetPostDto());
    await this._postService.checkPostExistAndOwner(postBefore, user.id);

    const isUpdated = await this._postService.updatePost(postId, user, createPostDto);
    if (isUpdated) {
      const postUpdated = await this._postService.getPost(postId, user, new GetPostDto());
      this._eventEmitter.emit(
        new PostHasBeenUpdatedEvent({
          oldPost: postBefore,
          newPost: postUpdated,
          actor: user.profile,
        })
      );
      return postUpdated;
    }
  }

  @ApiOperation({ summary: 'Publish post' })
  @ApiOkResponse({
    type: PostResponseDto,
    description: 'Publish post successfully',
  })
  @Put('/:postId/publish')
  public async publishPost(
    @AuthUser() user: UserDto,
    @Param('postId', ParseIntPipe) postId: number
  ): Promise<PostResponseDto> {
    const isPublished = await this._postService.publishPost(postId, user.id);
    if (isPublished) {
      const post = await this._postService.getPost(postId, user, new GetPostDto());
      this._eventEmitter.emit(
        new PostHasBeenPublishedEvent({
          post: post,
          actor: user.profile,
        })
      );
      return post;
    }
  }

  @ApiOperation({ summary: 'Delete post' })
  @ApiOkResponse({
    type: Boolean,
    description: 'Delete post successfully',
  })
  @Delete('/:id')
  public async deletePost(
    @AuthUser() user: UserDto,
    @Param('id', ParseIntPipe) postId: number
  ): Promise<boolean> {
    const postDeleted = await this._postService.deletePost(postId, user.id);
    if (postDeleted) {
      this._eventEmitter.emit(
        new PostHasBeenDeletedEvent({
          post: postDeleted,
          actor: user.profile,
        })
      );
      return true;
    }
  }

  @ApiOperation({ summary: 'Mark important post' })
  @ApiOkResponse({
    type: Boolean,
  })
  @Put('/:id/mark-as-read')
  public async markReadPost(
    @AuthUser() user: UserDto,
    @Param('id', ParseIntPipe) postId: number
  ): Promise<boolean> {
    await this._postService.markReadPost(postId, user.id);
    return true;
  }
}
