import { CONTENT_STATUS } from '@beincom/constants';
import { UserDto } from '@libs/service/user';
import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Req,
  Version,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { Request } from 'express';

import { VERSIONS_SUPPORTED, TRANSFORMER_VISIBLE_ONLY } from '../../../../common/constants';
import { ROUTES } from '../../../../common/constants/routes.constant';
import { AuthUser, ResponseMessages } from '../../../../common/decorators';
import {
  AutoSavePostCommand,
  CreateDraftPostCommand,
  PublishPostCommand,
  SchedulePostCommand,
  UpdatePostCommand,
} from '../../application/command/post';
import { CreateDraftPostDto, PostDto } from '../../application/dto';
import { FindPostQuery } from '../../application/query/post';
import {
  AutoSavePostRequestDto,
  CreateDraftPostRequestDto,
  PublishPostRequestDto,
  SchedulePostRequestDto,
  UpdatePostRequestDto,
} from '../dto/request';

@ApiTags('v2 Posts')
@ApiSecurity('authorization')
@Controller({
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
  @Post(ROUTES.POST.CREATE.PATH)
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
  @Put(ROUTES.POST.UPDATE.PATH)
  public async updatePost(
    @Param('postId', ParseUUIDPipe) postId: string,
    @AuthUser() authUser: UserDto,
    @Body() updatePostRequestDto: UpdatePostRequestDto,
    @Req() req: Request
  ): Promise<PostDto> {
    const { audience, tags, series, mentions } = updatePostRequestDto;

    const data = await this._commandBus.execute<UpdatePostCommand, PostDto>(
      new UpdatePostCommand({
        ...updatePostRequestDto,
        mentionUserIds: mentions,
        groupIds: audience?.groupIds,
        tagIds: tags,
        seriesIds: series,
        id: postId,
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
  @Put(ROUTES.POST.PUBLISH.PATH)
  public async publishPost(
    @Param('postId', ParseUUIDPipe) postId: string,
    @AuthUser() authUser: UserDto,
    @Body() publishData: PublishPostRequestDto,
    @Req() req: Request
  ): Promise<PostDto> {
    const data = await this._commandBus.execute<PublishPostCommand, PostDto>(
      new PublishPostCommand({
        ...publishData,
        id: postId,
        seriesIds: publishData.series,
        tagIds: publishData.tags,
        groupIds: publishData.audience?.groupIds,
        mentionUserIds: publishData.mentions,
        actor: authUser,
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
  @Patch(ROUTES.POST.AUTO_SAVE.PATH)
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
        authUser,
      })
    );
  }

  @ApiOperation({ summary: 'Get post detail' })
  @Get(ROUTES.POST.GET_DETAIL.PATH)
  public async getPostDetail(
    @Param('postId', ParseUUIDPipe) postId: string,
    @AuthUser() authUser: UserDto
  ): Promise<PostDto> {
    const data = await this._queryBus.execute(new FindPostQuery({ postId, authUser }));
    return plainToInstance(PostDto, data, { groups: [TRANSFORMER_VISIBLE_ONLY.PUBLIC] });
  }

  @ApiOperation({ summary: 'Schedule post' })
  @ResponseMessages({
    success: 'Successful Schedule',
    error: 'Fail Schedule',
  })
  @Put(ROUTES.POST.SCHEDULE.PATH)
  @Version(ROUTES.POST.SCHEDULE.VERSIONS)
  public async schedule(
    @Param('postId', ParseUUIDPipe) postId: string,
    @Body() scheduleData: SchedulePostRequestDto,
    @AuthUser() user: UserDto
  ): Promise<void> {
    await this._commandBus.execute<SchedulePostCommand, void>(
      new SchedulePostCommand({
        id: postId,
        content: scheduleData.content,
        seriesIds: scheduleData.series,
        tagIds: scheduleData.tags,
        groupIds: scheduleData.audience?.groupIds || [],
        media: scheduleData.media,
        mentionUserIds: scheduleData.mentions,
        linkPreview: scheduleData.linkPreview,
        scheduledAt: scheduleData.scheduledAt,
        actor: user,
      })
    );
  }
}
