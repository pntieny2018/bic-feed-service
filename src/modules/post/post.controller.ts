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
  Req,
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
import { Request } from 'express';
import { MediaStatus } from '../../database/models/media.model';

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
    return this._postAppService.getPost(user, postId, getPostDto);
  }

  @ApiOperation({ summary: 'Create post' })
  @ApiOkResponse({
    type: PostResponseDto,
    description: 'Create post successfully',
  })
  @ResponseMessages({
    success: 'message.post.created_success',
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
  @ResponseMessages({
    success: 'message.post.updated_success',
  })
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
  @ResponseMessages({
    success: 'message.post.published_success',
  })
  @Put('/:postId/publish')
  public async publish(
    @AuthUser() user: UserDto,
    @Param('postId', ParseUUIDPipe) postId: string,
    @Req() req: Request
  ): Promise<PostResponseDto> {
    const publishResult = await this._postAppService.publishPost(user, postId);
    if (
      publishResult?.media?.videos?.length > 0 &&
      publishResult.media.videos.find((video) => video.status === MediaStatus.WAITING_PROCESS)
    ) {
      req.message = 'message.post.published_success_with_video_waiting_process';
    }
    return publishResult;
  }

  @ApiOperation({ summary: 'Delete post' })
  @ApiOkResponse({
    type: Boolean,
    description: 'Delete post successfully',
  })
  @ResponseMessages({
    success: 'message.post.deleted_success',
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
