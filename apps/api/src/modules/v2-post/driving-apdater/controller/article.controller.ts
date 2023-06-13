import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { ResponseMessages } from '../../../../common/decorators';
import { AuthUser } from '../../../auth';
import { UserDto } from '../../../v2-user/application';
import {
  ContentNoCRUDPermissionException,
  ContentNotFoundException,
  ContentRequireGroupException,
} from '../../domain/exception';
import { DomainModelException } from '../../../../common/exceptions/domain-model.exception';
import { CreateDraftPostDto } from '../../application/command/create-draft-post/create-draft-post.dto';
import { plainToInstance } from 'class-transformer';
import { ArticleDto } from '../../application/dto';
import { AccessDeniedException } from '../../domain/exception/access-denied.exception';
import { VERSIONS_SUPPORTED } from '../../../../common/constants';
import { TRANSFORMER_VISIBLE_ONLY } from '../../../../common/constants/transformer.constant';
import { FindArticleQuery } from '../../application/query/find-article/find-article.query';
import { ArticleResponseDto } from '../../../article/dto/responses';
import { InjectUserToBody } from '../../../../common/decorators/inject.decorator';
import { CreateDraftArticleRequestDto } from '../dto/request/create-draft-article.request.dto';
import { CreateDraftArticleCommand } from '../../application/command/create-draft-article/create-draft-article.command';

@ApiTags('v2 Articles')
@ApiSecurity('authorization')
@Controller({
  path: 'articles',
  version: VERSIONS_SUPPORTED,
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
    try {
      const data = await this._queryBus.execute(new FindArticleQuery({ articleId, authUser }));
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

  @ApiOperation({ summary: 'Create article' })
  @ApiOkResponse({
    type: ArticleResponseDto,
    description: 'Create article successfully',
  })
  @Post('/')
  @InjectUserToBody()
  @ResponseMessages({
    success: 'message.article.created_success',
  })
  public async create(
    @AuthUser() authUser: UserDto,
    @Body() createDraftPostRequestDto: CreateDraftArticleRequestDto
  ): Promise<ArticleDto> {
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
}
