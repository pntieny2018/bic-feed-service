import {
  BadRequestException,
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
  UseGuards,
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
  CreateFastlaneDto,
  CreatePostDto,
  GetPostDto,
  GetPostEditedHistoryDto,
  SearchPostsDto,
  UpdatePostDto,
} from './dto/requests';
import { GetDraftPostDto } from './dto/requests/get-draft-posts.dto';
import { PostEditedHistoryDto, PostResponseDto } from './dto/responses';
import { PostService } from './post.service';
import { GetPostPipe } from './pipes';
import { AuthorityService } from '../authority';
import { InjectUserToBody } from '../../common/decorators/inject.decorator';
import { WebhookGuard } from '../auth/webhook.guard';
import { FeedService } from '../feed/feed.service';
import { PostSearchService } from './post-search.service';
import { UserService } from '../../shared/user';
import { GroupService } from '../../shared/group';

@ApiSecurity('authorization')
@ApiTags('Posts')
@Controller({
  version: APP_VERSION,
  path: 'posts',
})
export class PostController {
  private _logger = new Logger(PostController.name);
  public constructor(
    private _postService: PostService,
    private _postSearchService: PostSearchService,
    private _eventEmitter: InternalEventEmitterService,
    private _authorityService: AuthorityService,
    private _feedService: FeedService,
    private _userService: UserService,
    private _groupService: GroupService
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
    return this._postSearchService.searchPosts(user, searchPostsDto);
  }

  @ApiOperation({ summary: 'Get post edited history' })
  @ApiOkResponse({
    type: PostEditedHistoryDto,
  })
  @Get('/:postId/edited-history')
  public getPostEditedHistory(
    @AuthUser() user: UserDto,
    @Param('postId', ParseUUIDPipe) postId: string,
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
  public async getPost(
    @AuthUser(false) user: UserDto,
    @Param('postId', ParseUUIDPipe) postId: string,
    @Query(GetPostPipe) getPostDto: GetPostDto
  ): Promise<PostResponseDto> {
    getPostDto.hideSecretAudienceCanNotAccess = true;
    if (user === null) return this._postService.getPublicPost(postId, getPostDto);
    else {
      const post = await this._postService.getPost(postId, user, getPostDto);
      this._feedService.markSeenPosts(postId, user.id).catch((ex) => {
        this._logger.error(ex, ex.stack);
      });

      return post;
    }
  }

  @ApiOperation({ summary: 'Create post' })
  @ApiOkResponse({
    type: PostResponseDto,
    description: 'Create post successfully',
  })
  @Post('/')
  @InjectUserToBody()
  public async createPost(
    @AuthUser() user: UserDto,
    @Body() createPostDto: CreatePostDto
  ): Promise<any> {
    const { audience, setting } = createPostDto;
    if (audience.groupIds?.length > 0) {
      await this._authorityService.checkCanCreatePost(user, audience.groupIds, setting.isImportant);
    }
    const created = await this._postService.createPost(user, createPostDto);
    if (created) {
      return this._postService.getPost(created.id, user, new GetPostDto());
    }
  }

  @ApiOperation({ summary: 'Update post' })
  @ApiOkResponse({
    type: PostResponseDto,
    description: 'Update post successfully',
  })
  @Put('/:postId')
  @InjectUserToBody()
  public async updatePost(
    @AuthUser() user: UserDto,
    @Param('postId', ParseUUIDPipe) postId: string,
    @Body() updatePostDto: UpdatePostDto
  ): Promise<PostResponseDto> {
    const { audience, setting } = updatePostDto;
    const postBefore = await this._postService.getPost(postId, user, new GetPostDto());
    if (postBefore.isDraft === false && audience.groupIds.length === 0) {
      throw new BadRequestException('Audience is required');
    }
    await this._authorityService.checkCanUpdatePost(user, postBefore, audience.groupIds);

    const oldGroupIds = postBefore.audience.groups.map((group) => group.id);
    const newAudienceIds = audience.groupIds.filter((groupId) => !oldGroupIds.includes(groupId));
    if (newAudienceIds.length) {
      const isImportant = setting?.isImportant ?? postBefore.setting.isImportant;
      await this._authorityService.checkCanCreatePost(user, newAudienceIds, isImportant);
    }
    if (postBefore.isDraft === false) {
      this._postService.checkContent(updatePostDto.content, updatePostDto.media);
      const removeGroupIds = oldGroupIds.filter((id) => !audience.groupIds.includes(id));
      if (removeGroupIds.length) {
        await this._authorityService.checkCanDeletePost(user, removeGroupIds, postBefore.createdBy);
      }
    }

    const isUpdated = await this._postService.updatePost(postBefore, user, updatePostDto);
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
    @Param('postId', ParseUUIDPipe) postId: string
  ): Promise<PostResponseDto> {
    const isPublished = await this._postService.publishPost(postId, user);
    const post = await this._postService.getPost(postId, user, new GetPostDto());
    if (isPublished) {
      this._eventEmitter.emit(
        new PostHasBeenPublishedEvent({
          post: post,
          actor: user.profile,
        })
      );
    }

    return post;
  }

  @ApiOperation({ summary: 'Delete post' })
  @ApiOkResponse({
    type: Boolean,
    description: 'Delete post successfully',
  })
  @Delete('/:id')
  public async deletePost(
    @AuthUser() user: UserDto,
    @Param('id', ParseUUIDPipe) postId: string
  ): Promise<boolean> {
    const postDeleted = await this._postService.deletePost(postId, user);
    if (postDeleted) {
      this._eventEmitter.emit(
        new PostHasBeenDeletedEvent({
          post: postDeleted,
          actor: user.profile,
        })
      );
      return true;
    }
    return false;
  }

  @ApiOperation({ summary: 'Mark as read' })
  @ApiOkResponse({
    type: Boolean,
  })
  @Put('/:id/mark-as-read')
  public async markReadPost(
    @AuthUser() user: UserDto,
    @Param('id', ParseUUIDPipe) postId: string
  ): Promise<boolean> {
    await this._postService.markReadPost(postId, user.id);
    return true;
  }

  @UseGuards(WebhookGuard)
  @Post('/bot')
  public async deployNewVersionApp(
    @AuthUser() user: UserDto,
    @Body() createFastlaneDto: CreateFastlaneDto
  ): Promise<boolean> {
    const input = new CreatePostDto();
    input.content = createFastlaneDto.content;
    input.audience = {
      userIds: [],
      groupIds: createFastlaneDto.groupIds,
    };
    input.mentions = createFastlaneDto.mentionUserIds;

    const post = await this.createPost(user, input);

    await this.publishPost(user, post['id']);

    return true;
  }

  @Get('/get-user-group/:groupId/:userId/:postId')
  public async getUserGroup(
    @Param('groupId') groupId: string,
    @Param('userId') userId: string,
    @Param('postId') postId: string
  ): Promise<any> {
    const user = await this._userService.get(userId);
    const group = await this._groupService.get(groupId);
    const post = await this._postService.findPost({ postId });
    return {
      group,
      user,
      post,
    };
  }
}
