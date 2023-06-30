import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Req,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { ResponseMessages } from '../../../../common/decorators';
import { AuthUser } from '../../../auth';
import { UserDto } from '../../../v2-user/application';
import {
  ContentEmptyGroupException,
  ContentNoCRUDPermissionException,
  ContentNoEditSettingPermissionException,
  ContentNoPublishYetException,
  ContentNotFoundException,
  ContentRequireGroupException,
} from '../../domain/exception';
import { CreateDraftPostRequestDto, PublishPostRequestDto } from '../dto/request';
import { DomainModelException } from '../../../../common/exceptions/domain-model.exception';
import { CreateDraftPostCommand } from '../../application/command/create-draft-post/create-draft-post.command';
import { CreateDraftPostDto } from '../../application/command/create-draft-post/create-draft-post.dto';
import { plainToInstance } from 'class-transformer';
import { PublishPostCommand } from '../../application/command/publish-post/publish-post.command';
import { PostDto } from '../../application/dto';
import { Request } from 'express';
import { UserNoBelongGroupException } from '../../domain/exception/user-no-belong-group.exception';
import { ContentEmptyException } from '../../domain/exception/content-empty.exception';
import { TagSeriesInvalidException } from '../../domain/exception/tag-series-invalid.exception';
import { AccessDeniedException } from '../../domain/exception/access-denied.exception';
import { AutoSavePostCommand } from '../../application/command/auto-save-post/auto-save-post.command';
import { AutoSavePostRequestDto } from '../dto/request/auto-save-post.request.dto';
import { PostStatus } from '../../../../database/models/post.model';
import { VERSIONS_SUPPORTED } from '../../../../common/constants';
import { TRANSFORMER_VISIBLE_ONLY } from '../../../../common/constants/transformer.constant';
import { FindPostQuery } from '../../application/query/find-post/find-post.query';
import { UpdatePostCommand } from '../../application/command/update-post/update-post.command';
import { UpdatePostRequestDto } from '../dto/request/update-post.request.dto';

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
    try {
      const data = await this._commandBus.execute<CreateDraftPostCommand, CreateDraftPostDto>(
        new CreateDraftPostCommand({ groupIds: audience.groupIds, authUser })
      );

      return plainToInstance(PostDto, data, { groups: [TRANSFORMER_VISIBLE_ONLY.PUBLIC] });
    } catch (e) {
      switch (e.constructor) {
        case ContentNoEditSettingPermissionException:
        case ContentNoCRUDPermissionException:
          throw new ForbiddenException(e);
        case DomainModelException:
          throw new BadRequestException(e);
        default:
          throw e;
      }
    }
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
    try {
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

      if (data.status === PostStatus.PROCESSING) {
        req.message = 'message.post.published_success_with_video_waiting_process';
      }
      return plainToInstance(PostDto, data, { groups: [TRANSFORMER_VISIBLE_ONLY.PUBLIC] });
    } catch (e) {
      switch (e.constructor) {
        case ContentNotFoundException:
          throw new NotFoundException(e);
        case ContentNoEditSettingPermissionException:
        case ContentNoCRUDPermissionException:
        case AccessDeniedException:
          throw new ForbiddenException(e);
        case ContentNoPublishYetException:
        case DomainModelException:
        case UserNoBelongGroupException:
        case ContentEmptyException:
        case ContentEmptyGroupException:
        case TagSeriesInvalidException:
          throw new BadRequestException(e);
        default:
          throw e;
      }
    }
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
    try {
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

      if (data.status === PostStatus.PROCESSING) {
        req.message = 'message.post.published_success_with_video_waiting_process';
      }

      return plainToInstance(PostDto, data, { groups: [TRANSFORMER_VISIBLE_ONLY.PUBLIC] });
    } catch (e) {
      switch (e.constructor) {
        case ContentNotFoundException:
          throw new NotFoundException(e);
        case ContentNoEditSettingPermissionException:
        case ContentNoCRUDPermissionException:
        case AccessDeniedException:
          throw new ForbiddenException(e);
        case DomainModelException:
        case UserNoBelongGroupException:
        case ContentEmptyException:
        case ContentEmptyGroupException:
        case TagSeriesInvalidException:
          throw new BadRequestException(e);
        default:
          throw e;
      }
    }
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
    try {
      const data = await this._queryBus.execute(new FindPostQuery({ postId, authUser }));
      return plainToInstance(PostDto, data, { groups: [TRANSFORMER_VISIBLE_ONLY.PUBLIC] });
    } catch (e) {
      switch (e.constructor) {
        case ContentNotFoundException:
          throw new NotFoundException(e);
        case ContentRequireGroupException:
        case ContentNoCRUDPermissionException:
        case AccessDeniedException:
          throw new ForbiddenException(e);
        case DomainModelException:
          throw new BadRequestException(e);
        default:
          throw e;
      }
    }
  }
}
