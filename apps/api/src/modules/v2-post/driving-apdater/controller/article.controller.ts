import { UserDto } from '@libs/service/user';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Version,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { instanceToInstance } from 'class-transformer';

import { TRANSFORMER_VISIBLE_ONLY } from '../../../../common/constants';
import { ROUTES } from '../../../../common/constants/routes.constant';
import { AuthUser, ResponseMessages } from '../../../../common/decorators';
import { InjectUserToBody } from '../../../../common/decorators/inject.decorator';
import { ArticleResponseDto } from '../../../article/dto/responses';
import {
  AutoSaveArticleCommand,
  CreateDraftArticleCommand,
  DeleteArticleCommand,
  DeleteArticleCommandPayload,
  PublishArticleCommand,
  ScheduleArticleCommand,
  UpdateArticleCommand,
} from '../../application/command/article';
import { ArticleDto } from '../../application/dto';
import { FindArticleQuery } from '../../application/query/article';
import {
  PublishArticleRequestDto,
  UpdateArticleRequestDto,
  ScheduleArticleRequestDto,
} from '../dto/request';

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
    @Param('articleId', ParseUUIDPipe) id: string,
    @AuthUser() authUser: UserDto
  ): Promise<ArticleDto> {
    const data = this._queryBus.execute(new FindArticleQuery({ articleId: id, authUser }));
    return instanceToInstance(data, { groups: [TRANSFORMER_VISIBLE_ONLY.PUBLIC] });
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
    const data = this._commandBus.execute<CreateDraftArticleCommand, ArticleDto>(
      new CreateDraftArticleCommand({ authUser })
    );
    return instanceToInstance(data, { groups: [TRANSFORMER_VISIBLE_ONLY.PUBLIC] });
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
    @Param('articleId', ParseUUIDPipe) id: string
  ): Promise<void> {
    this._commandBus.execute<DeleteArticleCommand, void>(
      new DeleteArticleCommand({
        id,
        actor: user,
      } as DeleteArticleCommandPayload)
    );
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
    @Param('articleId', ParseUUIDPipe) articleId: string,
    @Body() updateData: UpdateArticleRequestDto,
    @AuthUser() authUser: UserDto
  ): Promise<void> {
    this._commandBus.execute<AutoSaveArticleCommand, void>(
      new AutoSaveArticleCommand({
        ...updateData,
        id: articleId,
        categoryIds: updateData.categories,
        seriesIds: updateData.series,
        tagIds: updateData.tags,
        groupIds: updateData.audience?.groupIds,
        actor: authUser,
      })
    );
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
    @Param('articleId', ParseUUIDPipe) articleId: string,
    @Body() updateData: UpdateArticleRequestDto,
    @AuthUser() authUser: UserDto
  ): Promise<ArticleDto> {
    const articleDto = this._commandBus.execute<UpdateArticleCommand, ArticleDto>(
      new UpdateArticleCommand({
        ...updateData,
        id: articleId,
        categoryIds: updateData.categories,
        seriesIds: updateData.series,
        tagIds: updateData.tags,
        groupIds: updateData.audience?.groupIds,
        actor: authUser,
      })
    );
    return instanceToInstance(articleDto, { groups: [TRANSFORMER_VISIBLE_ONLY.PUBLIC] });
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
    @Param('articleId', ParseUUIDPipe) articleId: string,
    @Body() publishData: PublishArticleRequestDto,
    @AuthUser() authUser: UserDto
  ): Promise<ArticleDto> {
    const articleDto = this._commandBus.execute<PublishArticleCommand, ArticleDto>(
      new PublishArticleCommand({
        ...publishData,
        id: articleId,
        categoryIds: publishData.categories,
        seriesIds: publishData.series,
        tagIds: publishData.tags,
        groupIds: publishData.audience?.groupIds,
        actor: authUser,
      })
    );
    return instanceToInstance(articleDto, { groups: [TRANSFORMER_VISIBLE_ONLY.PUBLIC] });
  }

  @ApiOperation({ summary: 'Schedule article' })
  @ApiOkResponse({ description: 'Schedule article successfully' })
  @ResponseMessages({
    success: 'Successful Schedule',
    error: 'Fail Schedule',
  })
  @Put(ROUTES.ARTICLE.SCHEDULE.PATH)
  @Version(ROUTES.ARTICLE.SCHEDULE.VERSIONS)
  public async schedule(
    @Param('articleId', ParseUUIDPipe) articleId: string,
    @Body() scheduleData: ScheduleArticleRequestDto,
    @AuthUser() user: UserDto
  ): Promise<void> {
    const { audience } = scheduleData;
    this._commandBus.execute<ScheduleArticleCommand, ArticleDto>(
      new ScheduleArticleCommand({
        ...scheduleData,
        id: articleId,
        categoryIds: scheduleData.categories,
        seriesIds: scheduleData.series,
        tagIds: scheduleData.tags,
        groupIds: audience?.groupIds,
        actor: user,
      })
    );
  }
}
