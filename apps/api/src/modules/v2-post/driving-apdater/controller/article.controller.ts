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
  ContentEmptyGroupException,
  ContentNoCRUDPermissionAtGroupException,
  ContentNoCRUDPermissionException,
  ContentNoEditSettingPermissionAtGroupException,
  ContentNotFoundException,
  ContentRequireGroupException,
  InvalidResourceImageException,
  SeriesRequiredCoverException,
} from '../../domain/exception';
import { DomainModelException } from '../../../../common/exceptions/domain-model.exception';
import { CreateDraftPostDto } from '../../application/command/create-draft-post/create-draft-post.dto';
import { plainToInstance } from 'class-transformer';
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
    type: ArticleResponseDto,
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
  ): Promise<void> {
    try {
      //TODO: Implement updateArticle method
    } catch (e) {
      switch (e.constructor) {
        case ContentNotFoundException:
          throw new NotFoundException(e);
        case ContentEmptyGroupException:
        case SeriesRequiredCoverException:
        case InvalidResourceImageException:
        case DomainModelException:
          throw new BadRequestException(e);
        case ContentNoCRUDPermissionAtGroupException:
        case ContentNoEditSettingPermissionAtGroupException:
          throw new ForbiddenException(e);
        default:
          throw e;
      }
    }
  }
}
