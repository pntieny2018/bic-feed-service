import { createMock } from '@golevelup/ts-jest';
import { getModelToken } from '@nestjs/sequelize';
import { Test, TestingModule } from '@nestjs/testing';
import { v4 } from 'uuid';
import { PostTagModel } from '../../../../../database/models/post-tag.model';
import { Sequelize } from 'sequelize-typescript';
import {
  ARTICLE_FACTORY_TOKEN,
  IArticleFactory,
  IPostFactory,
  ISeriesFactory,
  POST_FACTORY_TOKEN,
  SERIES_FACTORY_TOKEN,
} from '../../../domain/factory/interface';
import { Transaction } from 'sequelize';
import { PostFactory } from '../../../domain/factory';
import { ArticleFactory } from '../../../domain/factory/article.factory';
import { SeriesFactory } from '../../../domain/factory/series.factory';
import { PostModel } from '../../../../../database/models/post.model';
import { PostGroupModel } from '../../../../../database/models/post-group.model';
import { PostSeriesModel } from '../../../../../database/models/post-series.model';
import { ContentRepository } from '../../../driven-adapter/repository/content.repository';
import { postRecordMock } from '../../mock/post.model.mock';
import { LinkPreviewModel } from '../../../../../database/models/link-preview.model';
import { UserSeenPostModel } from '../../../../../database/models/user-seen-post.model';
import { contentEntityMock } from '../../mock/content.entity.mock';
import { postEntityMock } from '../../mock/post.entity.mock';
import { seriesEntityMock } from '../../mock/series.entity.mock';
import { UserMarkReadPostModel } from '../../../../../database/models/user-mark-read-post.model';

const transaction = createMock<Transaction>();

describe('ContentRepository', () => {
  let repo,
    userReadImportantPostModel,
    postModel,
    postGroupModel,
    postSeriesModel,
    postTagModel,
    linkPreviewModel,
    userSeenPostModel,
    sequelizeConnection;
  let postFactory: IPostFactory;
  let articleFactory: IArticleFactory;
  let seriesFactory: ISeriesFactory;
  let httpService;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContentRepository,
        {
          provide: POST_FACTORY_TOKEN,
          useValue: createMock<PostFactory>(),
        },
        {
          provide: ARTICLE_FACTORY_TOKEN,
          useValue: createMock<ArticleFactory>(),
        },
        {
          provide: SERIES_FACTORY_TOKEN,
          useValue: createMock<SeriesFactory>(),
        },
        {
          provide: getModelToken(PostModel),
          useValue: createMock<PostModel>(),
        },
        {
          provide: getModelToken(PostGroupModel),
          useValue: createMock<PostGroupModel>(),
        },
        {
          provide: getModelToken(PostSeriesModel),
          useValue: createMock<PostSeriesModel>(),
        },
        {
          provide: getModelToken(PostTagModel),
          useValue: createMock<PostTagModel>(),
        },
        {
          provide: getModelToken(PostGroupModel),
          useValue: createMock<PostGroupModel>(),
        },
        {
          provide: getModelToken(LinkPreviewModel),
          useValue: createMock<LinkPreviewModel>(),
        },
        {
          provide: getModelToken(UserSeenPostModel),
          useValue: createMock<UserSeenPostModel>(),
        },
        {
          provide: getModelToken(UserMarkReadPostModel),
          useValue: createMock<UserMarkReadPostModel>(),
        },
        {
          provide: Sequelize,
          useValue: createMock<Sequelize>(),
        },
      ],
    }).compile();

    repo = module.get<ContentRepository>(ContentRepository);
    postFactory = module.get(POST_FACTORY_TOKEN);
    articleFactory = module.get(ARTICLE_FACTORY_TOKEN);
    seriesFactory = module.get(SERIES_FACTORY_TOKEN);
    postModel = module.get<PostModel>(getModelToken(PostModel));
    postTagModel = module.get<PostTagModel>(getModelToken(PostTagModel));
    postGroupModel = module.get<PostGroupModel>(getModelToken(PostGroupModel));
    postSeriesModel = module.get<PostSeriesModel>(getModelToken(PostSeriesModel));
    linkPreviewModel = module.get<LinkPreviewModel>(getModelToken(LinkPreviewModel));
    userSeenPostModel = module.get<UserSeenPostModel>(getModelToken(UserSeenPostModel));
    userReadImportantPostModel = module.get<UserMarkReadPostModel>(
      getModelToken(UserMarkReadPostModel)
    );
    sequelizeConnection = module.get<Sequelize>(Sequelize);
    sequelizeConnection.transaction.mockResolvedValue(transaction);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('Should create post success', async () => {
      const spyCreate = jest.spyOn(postModel, 'create').mockResolvedValue(postRecordMock);
      const spyModel = jest.spyOn(repo, '_entityToModel').mockReturnThis();
      const spySetSeries = jest.spyOn(repo, '_setSeries').mockReturnThis();
      const spySetTags = jest.spyOn(repo, '_setTags').mockReturnThis();
      const spySetGroups = jest.spyOn(repo, '_setGroups').mockReturnThis();
      await repo.create(postEntityMock);

      expect(spyCreate).toBeCalled();
      expect(spyModel).toBeCalledWith(postEntityMock);
      expect(spySetSeries).toBeCalledWith(postEntityMock, transaction);
      expect(spySetTags).toBeCalledWith(postEntityMock, transaction);
      expect(spySetGroups).toBeCalledWith(postEntityMock, transaction);
      expect(transaction.commit).toBeCalled();
    });

    it('Should create series success', async () => {
      const spyCreate = jest.spyOn(postModel, 'create').mockResolvedValue(postRecordMock);
      const spyModel = jest.spyOn(repo, '_entityToModel').mockReturnThis();
      const spySetSeries = jest.spyOn(repo, '_setSeries').mockReturnThis();
      const spySetTags = jest.spyOn(repo, '_setTags').mockReturnThis();
      const spySetGroups = jest.spyOn(repo, '_setGroups').mockReturnThis();
      await repo.create(seriesEntityMock);

      expect(spyCreate).toBeCalled();
      expect(spyModel).toBeCalledWith(seriesEntityMock);
      expect(spySetSeries).toBeCalledTimes(0);
      expect(spySetTags).toBeCalledTimes(0);
      expect(spySetGroups).toBeCalledWith(seriesEntityMock, transaction);
      expect(transaction.commit).toBeCalled();
    });
    it('Should rollback success', async () => {
      const spyCreate = jest.spyOn(postModel, 'create').mockRejectedValue(new Error());
      jest.spyOn(repo, '_entityToModel').mockReturnThis();
      try {
        await repo.create(postEntityMock);
      } catch (e) {
        expect(spyCreate).toBeCalled();
        expect(transaction.commit).toBeCalledTimes(0);
        expect(transaction.rollback).toBeCalled();
      }
    });
  });

  describe('update', () => {
    it('Should update post success', async () => {
      const spyUpdate = jest.spyOn(postModel, 'update').mockResolvedValue(postRecordMock);
      const spyModel = jest.spyOn(repo, '_entityToModel').mockReturnThis();
      const spySetSeries = jest.spyOn(repo, '_setSeries').mockReturnThis();
      const spySetTags = jest.spyOn(repo, '_setTags').mockReturnThis();
      const spySetGroups = jest.spyOn(repo, '_setGroups').mockReturnThis();
      await repo.update(postEntityMock);

      expect(spyUpdate).toBeCalled();
      expect(spyModel).toBeCalledWith(postEntityMock);
      expect(spySetSeries).toBeCalledWith(postEntityMock, transaction);
      expect(spySetTags).toBeCalledWith(postEntityMock, transaction);
      expect(spySetGroups).toBeCalledWith(postEntityMock, transaction);
      expect(transaction.commit).toBeCalled();
    });
    it('Should update series success', async () => {
      const spyUpdate = jest.spyOn(postModel, 'update').mockResolvedValue(postRecordMock);
      const spyModel = jest.spyOn(repo, '_entityToModel').mockReturnThis();
      const spySetSeries = jest.spyOn(repo, '_setSeries').mockReturnThis();
      const spySetTags = jest.spyOn(repo, '_setTags').mockReturnThis();
      const spySetGroups = jest.spyOn(repo, '_setGroups').mockReturnThis();
      await repo.update(seriesEntityMock);

      expect(spyUpdate).toBeCalled();
      expect(spyModel).toBeCalledWith(seriesEntityMock);
      expect(spySetSeries).toBeCalledTimes(0);
      expect(spySetTags).toBeCalledTimes(0);
      expect(spySetGroups).toBeCalledWith(seriesEntityMock, transaction);
      expect(transaction.commit).toBeCalled();
    });
    it('Should rollback success', async () => {
      const spyUpdate = jest.spyOn(postModel, 'update').mockRejectedValue(new Error());
      jest.spyOn(repo, '_entityToModel').mockReturnThis();
      try {
        await repo.update(postEntityMock);
      } catch (e) {
        expect(spyUpdate).toBeCalled();
        expect(transaction.commit).toBeCalledTimes(0);
        expect(transaction.rollback).toBeCalled();
      }
    });
  });

  describe('setGroup', () => {
    it('Should add and delete groups success', async () => {
      const addGroupIds = [v4()];
      const removeGroupIds = contentEntityMock.get('groupIds');
      contentEntityMock.setGroups(addGroupIds);
      await repo._setGroups(contentEntityMock, transaction);
      const state = contentEntityMock.getState();
      expect(postGroupModel.bulkCreate).toBeCalledWith(
        addGroupIds.map((groupId) => ({
          groupId,
          postId: contentEntityMock.get('id'),
        })),
        { transaction, ignoreDuplicates: true }
      );
      expect(postGroupModel.destroy).toBeCalledWith({
        where: {
          postId: contentEntityMock.get('id'),
          groupId: removeGroupIds,
        },
        transaction,
      });
    });
  });
});
