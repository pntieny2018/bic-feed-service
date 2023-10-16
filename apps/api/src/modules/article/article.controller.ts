import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Version,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';

import { VERSIONS_SUPPORTED, VERSION_1_10_0 } from '../../common/constants';
import { AuthUser, ResponseMessages } from '../../common/decorators';
import { InjectUserToBody } from '../../common/decorators/inject.decorator';
import { PageDto } from '../../common/dto';
import { AppHelper } from '../../common/helpers';
import { GetPostsByParamsDto } from '../post/dto/requests/get-posts-by-params.dto';
import { PostResponseDto } from '../post/dto/responses';
import { UserDto } from '../v2-user/application';

import { ArticleAppService } from './application/article.app-service';
import { SearchArticlesDto } from './dto/requests';
import { GetRelatedArticlesDto } from './dto/requests/get-related-articles.dto';
import { ScheduleArticleDto } from './dto/requests/schedule-article.dto';
import { UpdateArticleDto } from './dto/requests/update-article.dto';
import { ValidateSeriesTagDto } from './dto/requests/validate-series-tag.dto';
import { ArticleSearchResponseDto } from './dto/responses/article-search.response.dto';
import { ArticleResponseDto } from './dto/responses/article.response.dto';

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
  @Version(AppHelper.getVersionsSupportedTo(VERSION_1_10_0))
  public searchArticles(
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
  @Version([VERSIONS_SUPPORTED[0]])
  public async getRelated(
    @AuthUser() user: UserDto,
    @Query() getArticleListDto: GetRelatedArticlesDto
  ): Promise<PageDto<ArticleResponseDto>> {
    return this._articleAppService.getRelatedById(user, getArticleListDto);
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

  @ApiOperation({ summary: 'Update article' })
  @ApiOkResponse({
    type: ArticleResponseDto,
    description: 'Update article successfully',
  })
  @ResponseMessages({
    success: 'message.article.updated_success',
  })
  @Version([VERSIONS_SUPPORTED[0]])
  @Put('/:id')
  @ResponseMessages({ success: 'Article updated' })
  @InjectUserToBody()
  public async update(
    @AuthUser() user: UserDto,
    @Param('id', ParseUUIDPipe) articleId: string,
    @Body() updateArticleDto: UpdateArticleDto
  ): Promise<ArticleResponseDto> {
    const result = await this._articleAppService.update(user, articleId, updateArticleDto);
    return result;
  }

  @ApiOperation({ summary: 'Publish article' })
  @ApiOkResponse({
    type: ArticleResponseDto,
    description: 'Publish article successfully',
  })
  @ResponseMessages({
    success: 'message.article.published_success',
  })
  @Version([VERSIONS_SUPPORTED[0]])
  @Put('/:id/publish')
  public async publish(
    @AuthUser() user: UserDto,
    @Param('id', ParseUUIDPipe) articleId: string
  ): Promise<ArticleResponseDto> {
    const result = await this._articleAppService.publish(user, articleId);
    return result;
  }

  @ApiOperation({ summary: 'Schedule article' })
  @ApiOkResponse({
    type: ArticleResponseDto,
    description: 'Schedule article successfully',
  })
  @ResponseMessages({
    success: 'message.article.scheduled_success',
  })
  @Version([VERSIONS_SUPPORTED[0], VERSIONS_SUPPORTED[1]])
  @Put('/:id/schedule')
  public async schedule(
    @AuthUser() user: UserDto,
    @Param('id', ParseUUIDPipe) articleId: string,
    @Body() scheduleArticleDto: ScheduleArticleDto
  ): Promise<ArticleResponseDto> {
    const result = await this._articleAppService.schedule(user, articleId, scheduleArticleDto);
    return result;
  }
}
