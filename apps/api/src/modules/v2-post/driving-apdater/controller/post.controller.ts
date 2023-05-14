import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Req,
  Version,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { ResponseMessages } from '../../../../common/decorators';
import { AuthUser } from '../../../auth';
import { UserDto } from '../../../v2-user/application';
import {
  ContentNoCRUDPermissionException,
  ContentNoEditSettingPermissionException,
} from '../../domain/exception';
import { CreateDraftPostRequestDto, PublishPostRequestDto } from '../dto/request';
import { DomainModelException } from '../../../../common/exceptions/domain-model.exception';
import { CreateDraftPostCommand } from '../../application/command/create-draft-post/create-draft-post.command';
import { CreateDraftPostDto } from '../../application/command/create-draft-post/create-draft-post.dto';
import { TRANSFORMER_VISIBLE_ONLY } from '../../../../common/constants/transformer.constant';
import { TransformInstanceToPlain } from 'class-transformer';
import { PublishPostCommand } from '../../application/command/publish-post/publish-post.command';
import { PostDto } from '../../application/dto';
import { Request } from 'express';

@ApiTags('v2 Posts')
@ApiSecurity('authorization')
@Controller({
  path: 'posts',
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
  @TransformInstanceToPlain({ groups: [TRANSFORMER_VISIBLE_ONLY.PUBLIC] })
  @Version('2')
  public async createDraft(
    @AuthUser() authUser: UserDto,
    @Body() createDraftPostRequestDto: CreateDraftPostRequestDto
  ): Promise<any> {
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
  @TransformInstanceToPlain({ groups: [TRANSFORMER_VISIBLE_ONLY.PUBLIC] })
  @Version('2')
  public async publishPost(
    @Param('postId', ParseUUIDPipe) postId: string,
    @AuthUser() authUser: UserDto,
    @Body() publishPostRequestDto: PublishPostRequestDto
  ): Promise<any> {
    const { audience, tags, series, mentions, media } = publishPostRequestDto;
    try {
      const data = await this._commandBus.execute<PublishPostCommand, PostDto>(
        new PublishPostCommand({
          ...publishPostRequestDto,
          id: postId,
          mentionUserIds: mentions,
          groupIds: audience.groupIds,
          tagIds: tags,
          seriesIds: series,
          media: {
            filesIds: media?.files,
            imagesIds: media?.images,
            videosIds: media?.videos,
          },
          authUser,
        })
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
}
