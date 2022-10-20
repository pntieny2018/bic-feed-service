import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { APP_VERSION } from '../../common/constants';
import { InjectUserToBody } from '../../common/decorators/inject.decorator';
import { PageDto } from '../../common/dto';
import { AuthUser, UserDto } from '../auth';
import { GetPostPipe } from '../post/pipes';
import { ArticleAppService } from './application/article.app-service';
import { GetListArticlesDto } from './dto/requests';
import { CreateArticleDto } from './dto/requests/create-article.dto';
import { GetArticleDto } from './dto/requests/get-article.dto';
import { GetDraftArticleDto } from './dto/requests/get-draft-article.dto';
import { GetRelatedArticlesDto } from './dto/requests/get-related-articles.dto';
import { UpdateArticleDto } from './dto/requests/update-article.dto';
import { ArticleResponseDto } from './dto/responses/article.response.dto';

@ApiSecurity('authorization')
@ApiTags('Articles')
@Controller({
  version: APP_VERSION,
  path: 'articles',
})
export class ArticleController {
  public constructor(private _articleAppService: ArticleAppService) {}

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

  @ApiOperation({ summary: 'Get list article' })
  @ApiOkResponse({
    type: ArticleResponseDto,
  })
  @Get('/')
  public getList(
    @AuthUser() user: UserDto,
    @Query() getArticleListDto: GetListArticlesDto
  ): Promise<PageDto<ArticleResponseDto>> {
    return this._articleAppService.getList(user, getArticleListDto);
  }

  @ApiOperation({ summary: 'Get article detail' })
  @ApiOkResponse({
    type: ArticleResponseDto,
  })
  @Get('/:id')
  public get(
    @AuthUser(false) user: UserDto,
    @Param('id', ParseUUIDPipe) articleId: string,
    @Query(GetPostPipe) getArticleDto: GetArticleDto
  ): Promise<ArticleResponseDto> {
    return this._articleAppService.get(user, articleId, getArticleDto);
  }

  @ApiOperation({ summary: 'Create article' })
  @ApiOkResponse({
    type: ArticleResponseDto,
    description: 'Create article successfully',
  })
  @Post('/')
  @InjectUserToBody()
  public async create(
    @AuthUser() user: UserDto,
    @Body() createArticleDto: CreateArticleDto
  ): Promise<ArticleResponseDto> {
    return await this._articleAppService.create(user, createArticleDto);
  }

  @ApiOperation({ summary: 'Update view article' })
  @ApiOkResponse({
    type: Boolean,
    description: 'Update view article successfully',
  })
  @Put('/:id/update-view')
  public async updateView(
    @AuthUser() user: UserDto,
    @Param('id', ParseUUIDPipe) articleId: string
  ): Promise<boolean> {
    return this._articleAppService.updateView(user, articleId);
  }

  @ApiOperation({ summary: 'Update article' })
  @ApiOkResponse({
    type: ArticleResponseDto,
    description: 'Update article successfully',
  })
  @Put('/:id')
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
  @Put('/:id/publish')
  public async publish(
    @AuthUser() user: UserDto,
    @Param('id', ParseUUIDPipe) articleId: string
  ): Promise<ArticleResponseDto> {
    return this._articleAppService.publish(user, articleId);
  }

  @ApiOperation({ summary: 'Delete article' })
  @ApiOkResponse({
    type: Boolean,
    description: 'Delete article successfully',
  })
  @Delete('/:id')
  public async delete(
    @AuthUser() user: UserDto,
    @Param('id', ParseUUIDPipe) articleId: string
  ): Promise<boolean> {
    return this._articleAppService.delete(user, articleId);
  }
}
