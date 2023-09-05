import { CONTENT_STATUS, ORDER } from '@beincom/constants';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import { I18nContext } from 'nestjs-i18n';

import { PageDto } from '../../../../../common/dto';
import {
  AutoSaveArticleCommand,
  CreateDraftArticleCommand,
  DeleteArticleCommand,
  PublishArticleCommand,
} from '../../../application/command/article';
import { ArticleDto } from '../../../application/dto';
import { FindArticleQuery } from '../../../application/query/article';
import { GetScheduleArticleQuery } from '../../../application/query/article/get-schedule-article';
import { ArticleController } from '../../../driving-apdater/controller/article.controller';
import {
  GetScheduleArticleDto,
  PublishArticleRequestDto,
  ScheduleArticleRequestDto,
  UpdateArticleRequestDto,
} from '../../../driving-apdater/dto/request';
import { articleDtoMock } from '../../mock/article.entity.mock';
import { userMock } from '../../mock/user.dto.mock';

describe('ArticleController', () => {
  let articleController: ArticleController;
  let command: CommandBus;
  let query: QueryBus;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ArticleController, CommandBus, QueryBus],
    }).compile();

    articleController = module.get<ArticleController>(ArticleController);
    command = module.get<CommandBus>(CommandBus);
    query = module.get<QueryBus>(QueryBus);

    jest.spyOn(I18nContext, 'current').mockImplementation(
      () =>
        ({
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          t: () => {},
        } as any)
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Get post detail', () => {
    it('Should get post detail successfully', async () => {
      const queryExecute = jest.spyOn(query, 'execute').mockResolvedValue({});
      await articleController.getPostDetail('id', userMock);
      expect(queryExecute).toBeCalledTimes(1);
      expect(queryExecute).toBeCalledWith(
        new FindArticleQuery({
          articleId: 'id',
          authUser: userMock,
        })
      );
    });
  });

  describe('Create draft article', () => {
    it('Should create draft article successfully', async () => {
      const commandExecute = jest.spyOn(command, 'execute').mockResolvedValue({});
      await articleController.create(userMock);
      expect(commandExecute).toBeCalledTimes(1);
      expect(commandExecute).toBeCalledWith(new CreateDraftArticleCommand({ authUser: userMock }));
    });
  });

  describe('Delete article', () => {
    it('should delete article successfully', () => {
      const commandExecute = jest.spyOn(command, 'execute').mockResolvedValue({});
      articleController.delete(userMock, 'id');

      expect(commandExecute).toBeCalledTimes(1);
      expect(commandExecute).toBeCalledWith(
        new DeleteArticleCommand({ id: 'id', actor: userMock })
      );
    });
  });

  describe('Auto save article', () => {
    const mockUpdateArticleRequestDto: UpdateArticleRequestDto = {
      content: 'content',
    };

    it('should auto save article successfully', () => {
      const commandExecute = jest.spyOn(command, 'execute').mockResolvedValue({});
      articleController.autoSave(userMock, 'id', mockUpdateArticleRequestDto);

      expect(commandExecute).toBeCalledTimes(1);
      expect(commandExecute).toBeCalledWith(
        new AutoSaveArticleCommand({
          id: 'id',
          actor: userMock,
          ...mockUpdateArticleRequestDto,
          groupIds: mockUpdateArticleRequestDto.audience?.groupIds,
        })
      );
    });
  });

  describe('Update article', () => {
    const mockUpdateArticleRequestDto: UpdateArticleRequestDto = {
      content: 'content',
      audience: {
        groupIds: ['id'],
      },
    };

    it('should update article successfully', () => {
      const commandExecute = jest.spyOn(command, 'execute').mockResolvedValue({});
      articleController.update(userMock, 'id', mockUpdateArticleRequestDto);

      expect(commandExecute).toBeCalledTimes(1);
      expect(commandExecute).toBeCalledWith(
        new AutoSaveArticleCommand({
          id: 'id',
          actor: userMock,
          ...mockUpdateArticleRequestDto,
          groupIds: mockUpdateArticleRequestDto.audience?.groupIds,
        })
      );
    });
  });

  describe('Publish article', () => {
    const mockPublishArticleRequestDto: PublishArticleRequestDto = {
      content: 'content',
    };

    it('should publish article successfully', () => {
      const commandExecute = jest.spyOn(command, 'execute').mockResolvedValue({});
      articleController.publish(userMock, 'id', mockPublishArticleRequestDto);

      expect(commandExecute).toBeCalledTimes(1);
      expect(commandExecute).toBeCalledWith(
        new PublishArticleCommand({
          id: 'id',
          actor: userMock,
          ...mockPublishArticleRequestDto,
          groupIds: mockPublishArticleRequestDto.audience?.groupIds,
        })
      );
    });
  });

  describe('Schedule article', () => {
    const mockPublishArticleRequestDto: ScheduleArticleRequestDto = {
      scheduledAt: new Date(),
    };

    it('should schedule article successfully', () => {
      const commandExecute = jest.spyOn(command, 'execute').mockResolvedValue({});
      articleController.schedule(userMock, 'id', mockPublishArticleRequestDto);

      expect(commandExecute).toBeCalledTimes(1);
      expect(commandExecute).toBeCalledWith(
        new PublishArticleCommand({
          id: 'id',
          actor: userMock,
          ...mockPublishArticleRequestDto,
          groupIds: mockPublishArticleRequestDto.audience?.groupIds,
        })
      );
    });
  });

  describe('Get schedule article', () => {
    const queryMock: GetScheduleArticleDto = {
      limit: 10,
      offset: 0,
      order: ORDER.ASC,
      status: [CONTENT_STATUS.SCHEDULE_FAILED, CONTENT_STATUS.WAITING_SCHEDULE],
    };

    it('Should get schedule article successfully', async () => {
      const queryExecute = jest.spyOn(query, 'execute').mockResolvedValue(
        new PageDto<ArticleDto>([articleDtoMock], {
          limit: 10,
          offset: 0,
          hasNextPage: false,
        })
      );
      const res = await articleController.getSchedule(userMock, queryMock);

      expect(queryExecute).toBeCalledTimes(1);
      expect(queryExecute).toBeCalledWith(
        new GetScheduleArticleQuery({
          user: userMock,
          limit: 10,
          offset: 0,
          order: ORDER.ASC,
          statuses: [CONTENT_STATUS.SCHEDULE_FAILED, CONTENT_STATUS.WAITING_SCHEDULE],
        })
      );
      expect(res).toEqual(
        new PageDto<ArticleDto>([articleDtoMock], {
          limit: 10,
          offset: 0,
          hasNextPage: false,
        })
      );
    });
  });
});
