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
import { instanceToInstance, plainToInstance } from 'class-transformer';

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
import { ArticleDto, CreateDraftPostDto } from '../../application/dto';
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
    @Param('id', ParseUUIDPipe) id: string,
    @AuthUser() authUser: UserDto
  ): Promise<ArticleDto> {
    const data = await this._queryBus.execute(new FindArticleQuery({ articleId: id, authUser }));
    return plainToInstance(ArticleDto, data, { groups: [TRANSFORMER_VISIBLE_ONLY.PUBLIC] });
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
    const data = await this._commandBus.execute<CreateDraftArticleCommand, CreateDraftPostDto>(
      new CreateDraftArticleCommand({ authUser })
    );
    return plainToInstance(ArticleDto, data, { groups: [TRANSFORMER_VISIBLE_ONLY.PUBLIC] });
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
    await this._commandBus.execute<DeleteArticleCommand, void>(
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
    @AuthUser() user: UserDto,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateArticleRequestDto: UpdateArticleRequestDto
  ): Promise<void> {
    const { audience } = updateArticleRequestDto;
    await this._commandBus.execute<AutoSaveArticleCommand, void>(
      new AutoSaveArticleCommand({
        id,
        actor: user,
        ...updateArticleRequestDto,
        groupIds: audience?.groupIds,
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
    @AuthUser() user: UserDto,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateArticleRequestDto: UpdateArticleRequestDto
  ): Promise<ArticleDto> {
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
  }

  @ApiOperation({ summary: 'Schedule article' })
  @ApiOkResponse({
    type: ArticleDto,
    description: 'Schedule article successfully',
  })
  @ResponseMessages({
    success: 'message.article.scheduled_success',
  })
  @Put(ROUTES.ARTICLE.SCHEDULE.PATH)
  @Version(ROUTES.ARTICLE.SCHEDULE.VERSIONS)
  public async schedule(
    @AuthUser() user: UserDto,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() scheduleArticleRequestDto: ScheduleArticleRequestDto
  ): Promise<ArticleDto> {
    const { audience } = scheduleArticleRequestDto;
    const articleDto = await this._commandBus.execute<ScheduleArticleCommand, ArticleDto>(
      new ScheduleArticleCommand({
        id,
        title: scheduleArticleRequestDto.title,
        summary: scheduleArticleRequestDto.summary,
        content: scheduleArticleRequestDto.content,
        categoryIds: scheduleArticleRequestDto.categories,
        seriesIds: scheduleArticleRequestDto.series,
        tagIds: scheduleArticleRequestDto.tags,
        groupIds: audience?.groupIds,
        coverMedia: scheduleArticleRequestDto.coverMedia,
        wordCount: scheduleArticleRequestDto.wordCount,
        scheduledAt: scheduleArticleRequestDto.scheduledAt,
        actor: user,
      })
    );
    return instanceToInstance(articleDto, { groups: [TRANSFORMER_VISIBLE_ONLY.PUBLIC] });
  }
}
