import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import { I18nContext } from 'nestjs-i18n';

import {
  AutoSaveArticleCommand,
  CreateDraftArticleCommand,
  DeleteArticleCommand,
  PublishArticleCommand,
} from '../../../application/command/article';
import { FindArticleQuery } from '../../../application/query/article';
import { ArticleController } from '../../../driving-apdater/controller/article.controller';
import {
  PublishArticleRequestDto,
  ScheduleArticleRequestDto,
  UpdateArticleRequestDto,
} from '../../../driving-apdater/dto/request';
import { createMockUserDto } from '../../mock/user.mock';

const userMock = createMockUserDto();

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
      await articleController.getArticleDetail('id', userMock);
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
      await articleController.createArticle(userMock, {
        audience: {
          groupIds: ['452f371c-58c3-45cb-abca-d68c70b82df2'],
        },
      });
      expect(commandExecute).toBeCalledTimes(1);
      expect(commandExecute).toBeCalledWith(
        new CreateDraftArticleCommand({
          authUser: userMock,
          groupIds: ['452f371c-58c3-45cb-abca-d68c70b82df2'],
        })
      );
    });
  });

  describe('Delete article', () => {
    it('should delete article successfully', () => {
      const commandExecute = jest.spyOn(command, 'execute').mockResolvedValue({});
      articleController.deleteArticle(userMock, 'id');

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
      articleController.autoSaveArticle('id', mockUpdateArticleRequestDto, userMock);

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
      articleController.updateArticle('id', mockUpdateArticleRequestDto, userMock);

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
      articleController.publishArticle('id', mockPublishArticleRequestDto, userMock);

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
      articleController.scheduleArticle('id', mockPublishArticleRequestDto, userMock);

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
});
