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
  ContentNotFoundException,
} from '../../domain/exception';
import { CreateDraftPostRequestDto, PublishPostRequestDto } from '../dto/request';
import { DomainModelException } from '../../../../common/exceptions/domain-model.exception';
import { CreateDraftPostCommand } from '../../application/command/create-draft-post/create-draft-post.command';
import { CreateDraftPostDto } from '../../application/command/create-draft-post/create-draft-post.dto';
import { plainToClass, plainToInstance } from 'class-transformer';
import { PublishPostCommand } from '../../application/command/publish-post/publish-post.command';
import { ArticleDto, PostDto } from '../../application/dto';
import { Request } from 'express';
import { UserNoBelongGroupException } from '../../domain/exception/user-no-belong-group.exception';
import { ContentEmptyException } from '../../domain/exception/content-empty.exception';
import { TagSeriesInvalidException } from '../../domain/exception/tag-series-invalid.exception';
import { AccessDeniedException } from '../../domain/exception/access-denied.exception';
import { AutoSavePostCommand } from '../../application/command/auto-save-post/auto-save-post.command';
import { AutoSavePostRequestDto } from '../dto/request/auto-save-post.request.dto';
import { PostStatus } from '../../../../database/models/post.model';
import { DEFAULT_APP_VERSION } from '../../../../common/constants';
import { TRANSFORMER_VISIBLE_ONLY } from '../../../../common/constants/transformer.constant';
import { FindCategoriesPaginationQuery } from '../../application/query/find-categories/find-categories-pagination.query';
import { FindPostQuery } from '../../application/query/find-post/find-post.query';
import { FindArticleQuery } from '../../application/query/find-article/find-article.query';

@ApiTags('v2 Articles')
@ApiSecurity('authorization')
@Controller({
  path: 'articles',
  version: DEFAULT_APP_VERSION,
})
export class ArticleController {
  public constructor(
    private readonly _commandBus: CommandBus,
    private readonly _queryBus: QueryBus
  ) {}

  @ApiOperation({ summary: 'Get post detail' })
  @Get('/:articleId')
  public async getPostDetail(
    @Param('articleId', ParseUUIDPipe) articleId: string,
    @AuthUser() authUser: UserDto
  ): Promise<ArticleDto> {
    const data = await this._queryBus.execute(new FindArticleQuery({ articleId, authUser }));
    return plainToInstance(ArticleDto, data, { groups: [TRANSFORMER_VISIBLE_ONLY.PUBLIC] });
  }
}
