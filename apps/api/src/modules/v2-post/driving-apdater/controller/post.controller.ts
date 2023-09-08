import { CONTENT_STATUS } from '@beincom/constants';
import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Put, Req } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { Request } from 'express';

import { VERSIONS_SUPPORTED, TRANSFORMER_VISIBLE_ONLY } from '../../../../common/constants';
import { AuthUser, ResponseMessages } from '../../../../common/decorators';
import { UserDto } from '../../../v2-user/application';
import {
  AutoSavePostCommand,
  CreateDraftPostCommand,
  PublishPostCommand,
  UpdatePostCommand,
} from '../../application/command/post';
import { CreateDraftPostDto, PostDto } from '../../application/dto';
import { FindPostQuery } from '../../application/query/post';
import {
  AutoSavePostRequestDto,
  CreateDraftPostRequestDto,
  PublishPostRequestDto,
  UpdatePostRequestDto,
} from '../dto/request';

@ApiTags('v2 Posts')
@ApiSecurity('authorization')
@Controller({
  path: 'posts',
  version: VERSIONS_SUPPORTED,
})
export class PostController {
  public constructor(
    private readonly _commandBus: CommandBus,
    private readonly _queryBus: QueryBus
  ) {}

  @ApiOperation({ summary: 'Create draft post' })
  @ResponseMessages({
    success: 'message.post.created_success',
  })
  @Post('/')
  public async createDraft(
    @AuthUser() authUser: UserDto,
    @Body() createDraftPostRequestDto: CreateDraftPostRequestDto
  ): Promise<CreateDraftPostDto> {
    const { audience } = createDraftPostRequestDto;

    const data = await this._commandBus.execute<CreateDraftPostCommand, CreateDraftPostDto>(
      new CreateDraftPostCommand({ groupIds: audience.groupIds, authUser })
    );

    return plainToInstance(PostDto, data, { groups: [TRANSFORMER_VISIBLE_ONLY.PUBLIC] });
  }

  @ApiOperation({ summary: 'Update post' })
  @ResponseMessages({
    success: 'message.post.updated_success',
  })
  @Put('/:postId')
  public async updatePost(
    @Param('postId', ParseUUIDPipe) postId: string,
    @AuthUser() authUser: UserDto,
    @Body() updatePostRequestDto: UpdatePostRequestDto,
    @Req() req: Request
  ): Promise<PostDto> {
    const { audience, tags, series, mentions, media } = updatePostRequestDto;

    const data = await this._commandBus.execute<UpdatePostCommand, PostDto>(
      new UpdatePostCommand({
        ...updatePostRequestDto,
        id: postId,
        mentionUserIds: mentions,
        groupIds: audience?.groupIds,
        tagIds: tags,
        seriesIds: series,
        media: media
          ? {
              filesIds: media?.files.map((file) => file.id),
              imagesIds: media?.images.map((image) => image.id),
              videosIds: media?.videos.map((video) => video.id),
            }
          : undefined,
        authUser,
      })
    );

    if (data.status === CONTENT_STATUS.PROCESSING) {
      req.message = 'message.post.published_success_with_video_waiting_process';
    }
    return plainToInstance(PostDto, data, { groups: [TRANSFORMER_VISIBLE_ONLY.PUBLIC] });
  }

  @ApiOperation({ summary: 'Publish post.' })
  @ResponseMessages({
    success: 'message.post.published_success',
  })
  @Put('/:postId/publish')
  public async publishPost(
    @Param('postId', ParseUUIDPipe) postId: string,
    @AuthUser() authUser: UserDto,
    @Body() publishPostRequestDto: PublishPostRequestDto,
    @Req() req: Request
  ): Promise<PostDto> {
    const { audience, tags, series, mentions, media } = publishPostRequestDto;

    const data = await this._commandBus.execute<PublishPostCommand, PostDto>(
      new PublishPostCommand({
        ...publishPostRequestDto,
        id: postId,
        mentionUserIds: mentions,
        groupIds: audience?.groupIds,
        tagIds: tags,
        seriesIds: series,
        media: media
          ? {
              filesIds: media?.files.map((file) => file.id),
              imagesIds: media?.images.map((image) => image.id),
              videosIds: media?.videos.map((video) => video.id),
            }
          : undefined,
        authUser,
      })
    );

    if (data.status === CONTENT_STATUS.PROCESSING) {
      req.message = 'message.post.published_success_with_video_waiting_process';
    }

    return plainToInstance(PostDto, data, { groups: [TRANSFORMER_VISIBLE_ONLY.PUBLIC] });
  }

  @ApiOperation({ summary: 'Auto save post' })
  @ResponseMessages({
    success: 'message.post.updated_success',
  })
  @Patch('/:postId')
  public async autoSave(
    @Param('postId', ParseUUIDPipe) postId: string,
    @AuthUser() authUser: UserDto,
    @Body() autoSavePostRequestDto: AutoSavePostRequestDto
  ): Promise<void> {
    const { audience, tags, series, mentions, media } = autoSavePostRequestDto;
    return this._commandBus.execute<AutoSavePostCommand, void>(
      new AutoSavePostCommand({
        ...autoSavePostRequestDto,
        id: postId,
        mentionUserIds: mentions,
        groupIds: audience?.groupIds,
        tagIds: tags,
        seriesIds: series,
        media: media
          ? {
              filesIds: media?.files.map((file) => file.id),
              imagesIds: media?.images.map((image) => image.id),
              videosIds: media?.videos.map((video) => video.id),
            }
          : undefined,
        authUser,
      })
    );
  }

  @ApiOperation({ summary: 'Get post detail' })
  @Get('/:postId')
  public async getPostDetail(
    @Param('postId', ParseUUIDPipe) postId: string,
    @AuthUser() authUser: UserDto
  ): Promise<PostDto> {
    const data = await this._queryBus.execute(new FindPostQuery({ postId, authUser }));
    return plainToInstance(PostDto, data, { groups: [TRANSFORMER_VISIBLE_ONLY.PUBLIC] });
  }
}
