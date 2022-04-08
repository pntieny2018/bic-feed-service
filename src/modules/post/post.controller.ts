import { PageDto } from '../../common/dto';
import { AuthUser } from '../auth';
import {
  Controller,
  Delete,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  Put,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiSecurity, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { PostService } from './post.service';
import { CreatePostDto, GetPostDto, SearchPostsDto, UpdatePostDto } from './dto/requests';
import { UserDto } from '../auth';
import { PostResponseDto } from './dto/responses';
import { GetDraftPostDto } from './dto/requests/get-draft-posts.dto';
import { APP_VERSION } from '../../common/constants';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  CreatedPostEvent,
  DeletedPostEvent,
  PublishedPostEvent,
  UpdatedPostEvent,
} from '../../events/post';

@ApiSecurity('authorization')
@ApiTags('Posts')
@Controller({
  version: APP_VERSION,
  path: 'posts',
})
export class PostController {
  public constructor(private _postService: PostService, private _eventEmitter: EventEmitter2) {}

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
      const post = await this._postService.getPost(created.id, user, new GetPostDto());
      this._eventEmitter.emit(CreatedPostEvent.event, new CreatedPostEvent(post, user.profile));
      return post;
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
    const currentPost = await this._postService.getPost(postId, user, new GetPostDto());
    await this._postService.checkPostExistAndOwner(currentPost, user.id);

    const isUpdated = await this._postService.updatePost(postId, user, createPostDto);
    if (isUpdated) {
      const postUpdated = await this._postService.getPost(postId, user, new GetPostDto());
      this._eventEmitter.emit(
        UpdatedPostEvent.event,
        new UpdatedPostEvent(
          {
            oldPost: currentPost,
            newPost: postUpdated,
          },
          user.profile
        )
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
      this._eventEmitter.emit(PublishedPostEvent.event, new PublishedPostEvent(post, user.profile));
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
        DeletedPostEvent.event,
        new DeletedPostEvent(postDeleted, user.profile)
      );
      return true;
    }
  }
}
