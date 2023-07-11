import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Version,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { ResponseMessages } from '../../../../common/decorators';
import { AuthUser } from '../../../auth';
import { UserDto } from '../../../v2-user/application';
import { ROUTES } from '../../../../common/constants/routes.constant';
import {
  ArticleLimitAttachedSeriesException,
  ArticleRequiredCoverException,
  CategoryInvalidException,
  ContentEmptyException,
  ContentEmptyGroupException,
  ContentNoCRUDPermissionAtGroupException,
  ContentNoCRUDPermissionException,
  ContentNoEditSettingPermissionAtGroupException,
  ContentNoPublishYetException,
  ContentNotFoundException,
  ContentRequireGroupException,
  InvalidResourceImageException,
  TagSeriesInvalidException,
} from '../../domain/exception';
import { DomainModelException } from '../../../../common/exceptions/domain-model.exception';
import { CreateDraftPostDto } from '../../application/command/create-draft-post/create-draft-post.dto';
import { instanceToInstance, plainToInstance } from 'class-transformer';
import { ArticleDto } from '../../application/dto';
import { AccessDeniedException } from '../../domain/exception/access-denied.exception';
import { TRANSFORMER_VISIBLE_ONLY } from '../../../../common/constants/transformer.constant';
import { FindArticleQuery } from '../../application/query/find-article/find-article.query';
import { ArticleResponseDto } from '../../../article/dto/responses';
import { InjectUserToBody } from '../../../../common/decorators/inject.decorator';
import { CreateDraftArticleCommand } from '../../application/command/create-draft-article/create-draft-article.command';
import {
  DeleteArticleCommand,
  DeleteArticleCommandPayload,
} from '../../application/command/delete-article/delete-article.command';
import { UpdateArticleRequestDto } from '../dto/request/update-artice.request.dto';
import { UpdateArticleCommand } from '../../application/command/update-article/update-article.command';
import { PublishArticleCommand } from '../../application/command/publish-article/publish-article.command';
import { AutoSaveArticleCommand } from '../../application/command/auto-save-article/auto-save-article.command';
import { PublishArticleRequestDto } from '../dto/request/publish-artice.request.dto';

@ApiTags('v2 Articles')
@ApiSecurity('authorization')
@Controller()
export class ArticleController {
  public constructor(
    private readonly _commandBus: CommandBus,
    private readonly _queryBus: QueryBus
  ) {}

  @ApiOperation({ summary: 'Get post detail' })
  @Get(ROUTES.ARTICLE.GET_DETAIL.PATH)
  @Version(ROUTES.ARTICLE.GET_DETAIL.VERSIONS)
  public async getPostDetail(
    @Param('id', ParseUUIDPipe) id: string,
    @AuthUser() authUser: UserDto
  ): Promise<ArticleDto> {
    try {
      const data = await this._queryBus.execute(new FindArticleQuery({ articleId: id, authUser }));
      return plainToInstance(ArticleDto, data, { groups: [TRANSFORMER_VISIBLE_ONLY.PUBLIC] });
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

  @ApiOperation({ summary: 'Create draft article' })
  @ApiOkResponse({
    type: ArticleResponseDto,
    description: 'Create article successfully',
  })
  @Post(ROUTES.ARTICLE.CREATE.PATH)
  @Version(ROUTES.ARTICLE.CREATE.VERSIONS)
  @InjectUserToBody()
  @ResponseMessages({
    success: 'message.article.created_success',
  })
  public async create(@AuthUser() authUser: UserDto): Promise<ArticleDto> {
    try {
      const data = await this._commandBus.execute<CreateDraftArticleCommand, CreateDraftPostDto>(
        new CreateDraftArticleCommand({ authUser })
      );
      return plainToInstance(ArticleDto, data, { groups: [TRANSFORMER_VISIBLE_ONLY.PUBLIC] });
    } catch (e) {
      switch (e.constructor) {
        case DomainModelException:
          throw new BadRequestException(e);
        default:
          throw e;
      }
    }
  }

  @ApiOperation({ summary: 'Delete article' })
  @ApiOkResponse({
    type: Boolean,
    description: 'Delete article successfully',
  })
  @ResponseMessages({
    success: 'message.article.deleted_success',
  })
  @Delete(ROUTES.ARTICLE.DELETE.PATH)
  @Version(ROUTES.ARTICLE.DELETE.VERSIONS)
  public async delete(
    @AuthUser() user: UserDto,
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<void> {
    try {
      await this._commandBus.execute<DeleteArticleCommand, void>(
        new DeleteArticleCommand({
          id,
          actor: user,
        } as DeleteArticleCommandPayload)
      );
    } catch (e) {
      switch (e.constructor) {
        case ContentNotFoundException:
          throw new NotFoundException(e);
        case DomainModelException:
          throw new BadRequestException(e);
        case AccessDeniedException:
        case ContentNoCRUDPermissionException:
        case ContentNoCRUDPermissionAtGroupException:
        case ContentNoEditSettingPermissionAtGroupException:
          throw new ForbiddenException(e);
        default:
          throw e;
      }
    }
  }

  @ApiOperation({ summary: 'Auto save article' })
  @ApiOkResponse({
    description: 'Update article successfully',
  })
  @ResponseMessages({
    success: 'message.article.updated_success',
  })
  @Patch(ROUTES.ARTICLE.AUTO_SAVE.PATH)
  @Version(ROUTES.ARTICLE.AUTO_SAVE.VERSIONS)
  public async autoSave(
    @AuthUser() user: UserDto,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateArticleRequestDto: UpdateArticleRequestDto
  ): Promise<void> {
    try {
      const { audience } = updateArticleRequestDto;
      await this._commandBus.execute<AutoSaveArticleCommand, void>(
        new AutoSaveArticleCommand({
          id,
          actor: user,
          ...updateArticleRequestDto,
          groupIds: audience?.groupIds,
        })
      );
    } catch (e) {
      switch (e.constructor) {
        case ContentNotFoundException:
          throw new NotFoundException(e);
        case ContentNoPublishYetException:
        case ContentEmptyException:
        case ContentEmptyGroupException:
        case ArticleRequiredCoverException:
        case InvalidResourceImageException:
        case CategoryInvalidException:
        case TagSeriesInvalidException:
        case DomainModelException:
          throw new BadRequestException(e);
        case AccessDeniedException:
        case ContentNoCRUDPermissionException:
        case ContentNoCRUDPermissionAtGroupException:
        case ContentNoEditSettingPermissionAtGroupException:
          throw new ForbiddenException(e);
        default:
          throw e;
      }
    }
  }

  @ApiOperation({ summary: 'Update article' })
  @ApiOkResponse({
    description: 'Update article successfully',
  })
  @ResponseMessages({
    success: 'message.article.updated_success',
  })
  @Put(ROUTES.ARTICLE.UPDATE.PATH)
  @Version(ROUTES.ARTICLE.UPDATE.VERSIONS)
  public async update(
    @AuthUser() user: UserDto,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateArticleRequestDto: UpdateArticleRequestDto
  ): Promise<ArticleDto> {
    try {
      const { audience } = updateArticleRequestDto;
      const articleDto = await this._commandBus.execute<UpdateArticleCommand, ArticleDto>(
        new UpdateArticleCommand({
          id,
          actor: user,
          ...updateArticleRequestDto,
          groupIds: audience?.groupIds,
        })
      );
      return instanceToInstance(articleDto, { groups: [TRANSFORMER_VISIBLE_ONLY.PUBLIC] });
    } catch (e) {
      switch (e.constructor) {
        case ContentNotFoundException:
          throw new NotFoundException(e);
        case ContentEmptyException:
        case ContentEmptyGroupException:
        case ArticleRequiredCoverException:
        case InvalidResourceImageException:
        case CategoryInvalidException:
        case TagSeriesInvalidException:
        case DomainModelException:
        case ArticleLimitAttachedSeriesException:
          throw new BadRequestException(e);
        case AccessDeniedException:
        case ContentNoCRUDPermissionException:
        case ContentNoCRUDPermissionAtGroupException:
        case ContentNoEditSettingPermissionAtGroupException:
        case AccessDeniedException:
          throw new ForbiddenException(e);
        default:
          throw e;
      }
    }
  }

  @ApiOperation({ summary: 'Publish article' })
  @ApiOkResponse({
    type: ArticleDto,
    description: 'Publish article successfully',
  })
  @ResponseMessages({
    success: 'message.article.published_success',
  })
  @Put(ROUTES.ARTICLE.PUBLISH.PATH)
  @Version(ROUTES.ARTICLE.PUBLISH.VERSIONS)
  public async publish(
    @AuthUser() user: UserDto,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() publishArticleRequestDto: PublishArticleRequestDto
  ): Promise<ArticleDto> {
    try {
      const { audience } = publishArticleRequestDto;
      const articleDto = await this._commandBus.execute<PublishArticleCommand, ArticleDto>(
        new PublishArticleCommand({
          id,
          actor: user,
          ...publishArticleRequestDto,
          groupIds: audience?.groupIds,
        })
      );
      return instanceToInstance(articleDto, { groups: [TRANSFORMER_VISIBLE_ONLY.PUBLIC] });
    } catch (e) {
      switch (e.constructor) {
        case ContentNotFoundException:
          throw new NotFoundException(e);
        case ContentEmptyException:
        case ContentEmptyGroupException:
        case ArticleRequiredCoverException:
        case InvalidResourceImageException:
        case CategoryInvalidException:
        case TagSeriesInvalidException:
        case DomainModelException:
        case ArticleLimitAttachedSeriesException:
          throw new BadRequestException(e);
        case AccessDeniedException:
        case ContentNoCRUDPermissionException:
        case ContentNoCRUDPermissionAtGroupException:
        case ContentNoEditSettingPermissionAtGroupException:
          throw new ForbiddenException(e);
        default:
          throw e;
      }
    }
  }
}
