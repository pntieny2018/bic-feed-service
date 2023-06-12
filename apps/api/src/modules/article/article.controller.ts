import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Version,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { VERSIONS_SUPPORTED } from '../../common/constants';
import { ResponseMessages } from '../../common/decorators';
import { InjectUserToBody } from '../../common/decorators/inject.decorator';
import { PageDto } from '../../common/dto';
import { AuthUser } from '../auth';
import { GetPostPipe } from '../post/pipes';
import { ArticleAppService } from './application/article.app-service';
import { SearchArticlesDto } from './dto/requests';
import { CreateArticleDto } from './dto/requests/create-article.dto';
import { GetArticleDto } from './dto/requests/get-article.dto';
import { GetDraftArticleDto } from './dto/requests/get-draft-article.dto';
import { GetRelatedArticlesDto } from './dto/requests/get-related-articles.dto';
import { UpdateArticleDto } from './dto/requests/update-article.dto';
import { ArticleSearchResponseDto } from './dto/responses/article-search.response.dto';
import { ArticleResponseDto } from './dto/responses/article.response.dto';
import { ValidateSeriesTagDto } from './dto/requests/validate-series-tag.dto';
import { ScheduleArticleDto } from './dto/requests/schedule-article.dto';
import { PostResponseDto } from '../post/dto/responses';
import { GetPostsByParamsDto } from '../post/dto/requests/get-posts-by-params.dto';
import { UserDto } from '../v2-user/application';
import {
  ContentNoCRUDPermissionException,
  ContentRequireGroupException,
} from '../v2-post/domain/exception';

@ApiSecurity('authorization')
@ApiTags('Articles')
@Controller({
  version: VERSIONS_SUPPORTED,
  path: 'articles',
})
export class ArticleController {
  public constructor(private _articleAppService: ArticleAppService) {}

  @ApiOperation({ summary: 'Search articles' })
  @ApiOkResponse({
    type: ArticleResponseDto,
  })
  @Get('/')
  public searchSeries(
    @AuthUser() user: UserDto,
    @Query() searchDto: SearchArticlesDto
  ): Promise<PageDto<ArticleSearchResponseDto>> {
    return this._articleAppService.searchArticles(user, searchDto);
  }

  @ApiOperation({ summary: 'Validate series and tags' })
  @ApiOkResponse({
    type: Boolean,
    description: 'Validate article series and tags successfully',
  })
  @Post('/validate-series-tags')
  public async validateSeriesTags(
    @Body() validateSeriesTagDto: ValidateSeriesTagDto
  ): Promise<boolean> {
    return this._articleAppService.isSeriesAndTagsValid(
      validateSeriesTagDto.groups,
      validateSeriesTagDto.series,
      validateSeriesTagDto.tags
    );
  }

  @ApiOperation({ summary: 'Get related article' })
  @ApiOkResponse({
    type: Boolean,
    description: 'Get related article successfully',
  })
  @Get('/related')
  public async getRelated(
    @AuthUser() user: UserDto,
    @Query() getArticleListDto: GetRelatedArticlesDto
  ): Promise<PageDto<ArticleResponseDto>> {
    return this._articleAppService.getRelatedById(user, getArticleListDto);
  }

  @ApiOperation({ summary: 'Get draft articles' })
  @ApiOkResponse({
    type: ArticleResponseDto,
  })
  @Get('/draft')
  public getDrafts(
    @AuthUser() user: UserDto,
    @Query() getDraftDto: GetDraftArticleDto
  ): Promise<PageDto<ArticleResponseDto>> {
    return this._articleAppService.getDrafts(user, getDraftDto);
  }

  @ApiOperation({ summary: 'Get posts by params' })
  @ApiOkResponse({
    type: PostResponseDto,
  })
  @Get('/params')
  public getsByParams(
    @AuthUser() user: UserDto,
    @Query() getPostsByParamsDto: GetPostsByParamsDto
  ): Promise<PageDto<PostResponseDto>> {
    return this._articleAppService.getsByParams(user, getPostsByParamsDto);
  }

  // @ApiOperation({ summary: 'Get list article' })
  // @ApiOkResponse({
  //   type: ArticleResponseDto,
  // })
  // @Get('/')
  // public getList(
  //   @AuthUser() user: MediaDto,
  //   @Query() getArticleListDto: GetListArticlesDto
  // ): Promise<PageDto<ArticleResponseDto>> {
  //   return this._articleAppService.getList(user, getArticleListDto);
  // }

  @ApiOperation({ summary: 'Get article detail' })
  @ApiOkResponse({
    type: ArticleResponseDto,
  })
  @Get('/:id')
  @Version([VERSIONS_SUPPORTED[0], VERSIONS_SUPPORTED[1]])
  public async get(
    @AuthUser(false) user: UserDto,
    @Param('id', ParseUUIDPipe) articleId: string,
    @Query(GetPostPipe) getArticleDto: GetArticleDto
  ): Promise<ArticleResponseDto> {
    try {
      const article = await this._articleAppService.get(user, articleId, getArticleDto);
      return article;
    } catch (e) {
      switch (e.constructor) {
        case ContentRequireGroupException:
          throw new ForbiddenException(e);
        case ContentNoCRUDPermissionException:
          throw new ForbiddenException(e);
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
  @Version([VERSIONS_SUPPORTED[0], VERSIONS_SUPPORTED[1]])
  public async create(
    @AuthUser() user: UserDto,
    @Body() createArticleDto: CreateArticleDto
  ): Promise<ArticleResponseDto> {
    return await this._articleAppService.create(user, createArticleDto);
  }

  @ApiOperation({ summary: 'Update article' })
  @ApiOkResponse({
    type: ArticleResponseDto,
    description: 'Update article successfully',
  })
  @ResponseMessages({
    success: 'message.article.updated_success',
  })
  @Put('/:id')
  @ResponseMessages({ success: 'Article updated' })
  @InjectUserToBody()
  public async update(
    @AuthUser() user: UserDto,
    @Param('id', ParseUUIDPipe) articleId: string,
    @Body() updateArticleDto: UpdateArticleDto
  ): Promise<ArticleResponseDto> {
    return this._articleAppService.update(user, articleId, updateArticleDto);
  }

  @ApiOperation({ summary: 'Publish article' })
  @ApiOkResponse({
    type: ArticleResponseDto,
    description: 'Publish article successfully',
  })
  @ResponseMessages({
    success: 'message.article.published_success',
  })
  @Put('/:id/publish')
  public async publish(
    @AuthUser() user: UserDto,
    @Param('id', ParseUUIDPipe) articleId: string
  ): Promise<ArticleResponseDto> {
    return this._articleAppService.publish(user, articleId);
  }

  @ApiOperation({ summary: 'Schedule article' })
  @ApiOkResponse({
    type: ArticleResponseDto,
    description: 'Schedule article successfully',
  })
  @ResponseMessages({
    success: 'message.article.scheduled_success',
  })
  @Put('/:id/schedule')
  public async schedule(
    @AuthUser() user: UserDto,
    @Param('id', ParseUUIDPipe) articleId: string,
    @Body() scheduleArticleDto: ScheduleArticleDto
  ): Promise<ArticleResponseDto> {
    return this._articleAppService.schedule(user, articleId, scheduleArticleDto);
  }

  @ApiOperation({ summary: 'Delete article' })
  @ApiOkResponse({
    type: Boolean,
    description: 'Delete article successfully',
  })
  @ResponseMessages({
    success: 'message.article.deleted_success',
  })
  @Delete('/:id')
  public async delete(
    @AuthUser() user: UserDto,
    @Param('id', ParseUUIDPipe) articleId: string
  ): Promise<boolean> {
    return this._articleAppService.delete(user, articleId);
  }
}
