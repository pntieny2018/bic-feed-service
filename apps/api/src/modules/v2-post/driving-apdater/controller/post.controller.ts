import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
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
  ContentNotFoundException,
} from '../../domain/exception';
import { CreateDraftPostRequestDto, PublishPostRequestDto } from '../dto/request';
import { DomainModelException } from '../../../../common/exceptions/domain-model.exception';
import { CreateDraftPostCommand } from '../../application/command/create-draft-post/create-draft-post.command';
import { CreateDraftPostDto } from '../../application/command/create-draft-post/create-draft-post.dto';
import { plainToClass } from 'class-transformer';
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
import { DEFAULT_APP_VERSION } from '../../../../common/constants';

@ApiTags('v2 Posts')
@ApiSecurity('authorization')
@Controller({
  path: 'posts',
  version: DEFAULT_APP_VERSION,
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

      return data;
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

  @ApiOperation({ summary: 'Publish post' })
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

      return plainToClass(PostDto, data);
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
    try {
      const data = await this._commandBus.execute<AutoSavePostCommand, void>(
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
      return data;
    } catch (e) {
      console.log(e);
    }
  }
}
