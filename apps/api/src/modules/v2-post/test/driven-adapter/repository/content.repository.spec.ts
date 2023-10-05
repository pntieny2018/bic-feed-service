/* eslint-disable @typescript-eslint/unbound-method */
import { TestBed } from '@automock/jest';
import { CONTENT_TARGET, CONTENT_TYPE } from '@beincom/constants';
import { createMock } from '@golevelup/ts-jest';
import { ILibContentRepository, LIB_CONTENT_REPOSITORY_TOKEN } from '@libs/database/postgres';
import { PostAttributes, PostModel } from '@libs/database/postgres/model/post.model';
import { ReportContentDetailModel } from '@libs/database/postgres/model/report-content-detail.model';
import { Transaction, Op } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { v4 } from 'uuid';

import { ContentNotFoundException } from '../../../domain/exception';
import {
  ArticleEntity,
  ContentEntity,
  PostEntity,
  SeriesEntity,
} from '../../../domain/model/content';
import { IContentRepository } from '../../../domain/repositoty-interface';
import { ContentMapper } from '../../../driven-adapter/mapper/content.mapper';
import { ContentRepository } from '../../../driven-adapter/repository/content.repository';
import {
  MockClass,
  createMockCategoryEntity,
  createMockReportContentDetailRecord,
  createMockTagEntity,
} from '../../mock';
import {
  createMockArticleEntity,
  createMockArticleRecord,
  createMockContentEntity,
  createMockPostEntity,
  createMockPostRecord,
  createMockSeriesEntity,
  createMockSeriesRecord,
} from '../../mock/content.mock';

describe('ContentRepository', () => {
  let _contentRepo: IContentRepository;
  let _libContentRepository: MockClass<ILibContentRepository>;
  let _contentMapper: jest.Mocked<ContentMapper>;
  let _sequelizeConnection: Sequelize;
  let transaction: Transaction;

  let mockPostRecord: PostAttributes;
  let mockArticleRecord: PostAttributes;
  let mockSeriesRecord: PostAttributes;
  let mockPostEntity: PostEntity;
  let mockArticleEntity: ArticleEntity;
  let mockSeriesEntity: SeriesEntity;
  let mockContentEntity: ContentEntity;

  beforeEach(async () => {
    const { unit, unitRef } = TestBed.create(ContentRepository).compile();

    _contentRepo = unit;
    _libContentRepository = unitRef.get(LIB_CONTENT_REPOSITORY_TOKEN);
    _contentMapper = unitRef.get(ContentMapper);
    _sequelizeConnection = unitRef.get(Sequelize);
    transaction = createMock<Transaction>();

    _sequelizeConnection.transaction = jest.fn().mockResolvedValue(transaction);

    mockPostRecord = createMockPostRecord();
    mockArticleRecord = createMockArticleRecord();
    mockSeriesRecord = createMockSeriesRecord();
    mockPostEntity = createMockPostEntity(mockPostRecord);
    mockArticleEntity = createMockArticleEntity(mockArticleRecord);
    mockSeriesEntity = createMockSeriesEntity(mockSeriesRecord);
    mockContentEntity = createMockContentEntity();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    beforeEach(() => {
      _contentRepo['_setSeries'] = jest.fn();
      _contentRepo['_setTags'] = jest.fn();
      _contentRepo['_setGroups'] = jest.fn();
    });

    it('Should create post success', async () => {
      _contentMapper.toPersistence.mockReturnValue(mockPostRecord);

      await _contentRepo.create(mockPostEntity);

      expect(_contentMapper.toPersistence).toBeCalledWith(mockPostEntity);
      expect(_libContentRepository.create).toBeCalledWith(mockPostRecord, { transaction });
      expect(_contentRepo['_setSeries']).toBeCalledWith(mockPostEntity, transaction);
      expect(_contentRepo['_setTags']).toBeCalledWith(mockPostEntity, transaction);
      expect(_contentRepo['_setGroups']).toBeCalledWith(mockPostEntity, transaction);
      expect(transaction.commit).toBeCalled();
      expect(transaction.rollback).not.toBeCalled();
    });

    it('Should create article success', async () => {
      _contentMapper.toPersistence.mockReturnValue(mockArticleRecord);

      await _contentRepo.create(mockArticleEntity);

      expect(_contentMapper.toPersistence).toBeCalledWith(mockArticleEntity);
      expect(_libContentRepository.create).toBeCalledWith(mockArticleRecord, { transaction });
      expect(_contentRepo['_setSeries']).toBeCalledWith(mockArticleEntity, transaction);
      expect(_contentRepo['_setTags']).toBeCalledWith(mockArticleEntity, transaction);
      expect(_contentRepo['_setGroups']).toBeCalledWith(mockArticleEntity, transaction);
      expect(transaction.commit).toBeCalled();
      expect(transaction.rollback).not.toBeCalled();
    });

    it('Should create series success', async () => {
      _contentMapper.toPersistence.mockReturnValue(mockSeriesRecord);

      await _contentRepo.create(mockSeriesEntity);

      expect(_contentMapper.toPersistence).toBeCalledWith(mockSeriesEntity);
      expect(_libContentRepository.create).toBeCalledWith(mockSeriesRecord, { transaction });
      expect(_contentRepo['_setSeries']).not.toBeCalled();
      expect(_contentRepo['_setTags']).not.toBeCalled();
      expect(_contentRepo['_setGroups']).toBeCalledWith(mockSeriesEntity, transaction);
      expect(transaction.commit).toBeCalled();
      expect(transaction.rollback).not.toBeCalled();
    });

    it('Should rollback success', async () => {
      _contentMapper.toPersistence.mockReturnValue(mockPostRecord);
      _libContentRepository.create.mockRejectedValue(new Error());

      try {
        await _contentRepo.create(mockPostEntity);
      } catch (e) {
        expect(_contentMapper.toPersistence).toBeCalledWith(mockPostEntity);
        expect(_libContentRepository.create).toBeCalledWith(mockPostRecord, { transaction });
        expect(_contentRepo['_setSeries']).not.toBeCalled();
        expect(_contentRepo['_setTags']).not.toBeCalled();
        expect(_contentRepo['_setGroups']).not.toBeCalled();
        expect(transaction.commit).not.toBeCalled();
        expect(transaction.rollback).toBeCalled();
      }
    });
  });

  describe('update', () => {
    beforeEach(() => {
      _contentRepo['_setSeries'] = jest.fn();
      _contentRepo['_setTags'] = jest.fn();
      _contentRepo['_setCategories'] = jest.fn();
      _contentRepo['_setGroups'] = jest.fn();
    });

    it('Should update post success', async () => {
      _contentMapper.toPersistence.mockReturnValue(mockPostRecord);

      await _contentRepo.update(mockPostEntity);

      expect(_contentMapper.toPersistence).toBeCalledWith(mockPostEntity);
      expect(_libContentRepository.update).toBeCalledWith(
        mockPostRecord.id,
        mockPostRecord,
        transaction
      );
      expect(_contentRepo['_setSeries']).toBeCalledWith(mockPostEntity, transaction);
      expect(_contentRepo['_setTags']).toBeCalledWith(mockPostEntity, transaction);
      expect(_contentRepo['_setCategories']).not.toBeCalled();
      expect(_contentRepo['_setGroups']).toBeCalledWith(mockPostEntity, transaction);
      expect(transaction.commit).toBeCalled();
      expect(transaction.rollback).not.toBeCalled();
    });

    it('Should update article success', async () => {
      _contentMapper.toPersistence.mockReturnValue(mockArticleRecord);

      await _contentRepo.update(mockArticleEntity);

      expect(_contentMapper.toPersistence).toBeCalledWith(mockArticleEntity);
      expect(_libContentRepository.update).toBeCalledWith(
        mockArticleRecord.id,
        mockArticleRecord,
        transaction
      );
      expect(_contentRepo['_setSeries']).toBeCalledWith(mockArticleEntity, transaction);
      expect(_contentRepo['_setTags']).toBeCalledWith(mockArticleEntity, transaction);
      expect(_contentRepo['_setCategories']).toBeCalledWith(mockArticleEntity, transaction);
      expect(_contentRepo['_setGroups']).toBeCalledWith(mockArticleEntity, transaction);
      expect(transaction.commit).toBeCalled();
      expect(transaction.rollback).not.toBeCalled();
    });

    it('Should update series success', async () => {
      _contentMapper.toPersistence.mockReturnValue(mockSeriesRecord);

      await _contentRepo.update(mockSeriesEntity);

      expect(_contentMapper.toPersistence).toBeCalledWith(mockSeriesEntity);
      expect(_libContentRepository.update).toBeCalledWith(
        mockSeriesRecord.id,
        mockSeriesRecord,
        transaction
      );
      expect(_contentRepo['_setSeries']).not.toBeCalled();
      expect(_contentRepo['_setTags']).not.toBeCalled();
      expect(_contentRepo['_setCategories']).not.toBeCalled();
      expect(_contentRepo['_setGroups']).toBeCalledWith(mockSeriesEntity, transaction);
      expect(transaction.commit).toBeCalled();
      expect(transaction.rollback).not.toBeCalled();
    });

    it('Should rollback success', async () => {
      _contentMapper.toPersistence.mockReturnValue(mockPostRecord);
      _libContentRepository.update.mockRejectedValue(new Error());

      try {
        await _contentRepo.update(mockPostEntity);
      } catch (e) {
        expect(_contentMapper.toPersistence).toBeCalledWith(mockPostEntity);
        expect(_libContentRepository.update).toBeCalledWith(
          mockPostRecord.id,
          mockPostRecord,
          transaction
        );
        expect(_contentRepo['_setSeries']).not.toBeCalled();
        expect(_contentRepo['_setTags']).not.toBeCalled();
        expect(_contentRepo['_setCategories']).not.toBeCalled();
        expect(_contentRepo['_setGroups']).not.toBeCalled();
        expect(transaction.commit).not.toBeCalled();
        expect(transaction.rollback).toBeCalled();
      }
    });
  });

  describe('_setGroups', () => {
    it('Should add and delete groups success', async () => {
      const mockAttachGroupIds = [v4()];
      const mockDetachGroupIds = mockContentEntity.getGroupIds();

      mockContentEntity.setGroups(mockAttachGroupIds);

      await _contentRepo['_setGroups'](mockContentEntity, transaction);

      expect(_libContentRepository.bulkCreatePostGroup).toBeCalledWith(
        mockAttachGroupIds.map((groupId) => ({ postId: mockContentEntity.getId(), groupId })),
        { transaction, ignoreDuplicates: true }
      );
      expect(_libContentRepository.deletePostGroup).toBeCalledWith(
        { postId: mockContentEntity.getId(), groupId: mockDetachGroupIds },
        transaction
      );
    });
  });

  describe('_setSeries', () => {
    it('Should add and delete series success', async () => {
      const mockAttachSeriesIds = [v4()];
      const mockDetachSeriesIds = mockPostEntity.getSeriesIds();

      mockPostEntity.updateAttribute({ seriesIds: mockAttachSeriesIds }, v4());

      await _contentRepo['_setSeries'](mockPostEntity, transaction);

      expect(_libContentRepository.bulkCreatePostSeries).toBeCalledWith(
        mockAttachSeriesIds.map((seriesId) => ({ postId: mockPostEntity.getId(), seriesId })),
        { transaction, ignoreDuplicates: true }
      );
      expect(_libContentRepository.deletePostSeries).toBeCalledWith(
        { postId: mockPostEntity.getId(), seriesId: mockDetachSeriesIds },
        transaction
      );
    });
  });

  describe('_setTags', () => {
    it('Should add and delete tags success', async () => {
      const mockAttachTagIds = [v4()];
      const mockDetachTagIds = mockArticleEntity.get('tags').map((tag) => tag.get('id'));

      mockArticleEntity.setTags(
        mockAttachTagIds.map((tagId) => createMockTagEntity({ id: tagId }))
      );

      await _contentRepo['_setTags'](mockArticleEntity, transaction);

      expect(_libContentRepository.bulkCreatePostTag).toBeCalledWith(
        mockAttachTagIds.map((tagId) => ({ postId: mockArticleEntity.getId(), tagId })),
        { transaction, ignoreDuplicates: true }
      );
      expect(_libContentRepository.deletePostTag).toBeCalledWith(
        { postId: mockArticleEntity.getId(), tagId: mockDetachTagIds },
        transaction
      );
    });
  });

  describe('_setCategories', () => {
    it('Should add and delete category success', async () => {
      const mockAttachCategoryIds = [v4()];
      const mockDetachCategoryIds = mockArticleEntity
        .get('categories')
        .map((category) => category.get('id'));

      mockArticleEntity.setCategories(
        mockAttachCategoryIds.map((categoryId) => createMockCategoryEntity({ id: categoryId }))
      );

      await _contentRepo['_setCategories'](mockArticleEntity, transaction);

      expect(_libContentRepository.bulkCreatePostCategory).toBeCalledWith(
        mockAttachCategoryIds.map((categoryId) => ({
          postId: mockArticleEntity.getId(),
          categoryId,
        })),
        { transaction, ignoreDuplicates: true }
      );
      expect(_libContentRepository.deletePostCategory).toBeCalledWith(
        { postId: mockArticleEntity.getId(), categoryId: mockDetachCategoryIds },
        transaction
      );
    });
  });

  describe('delete', () => {
    it('Should delete content success', async () => {
      const mockContentId = v4();
      await _contentRepo.delete(mockContentId);

      expect(_libContentRepository.delete).toBeCalledWith(mockContentId);
    });
  });

  describe('findContentById', () => {
    it('Should find content without option success', async () => {
      const mockPostId = mockPostRecord.id;
      _libContentRepository.findOne.mockResolvedValue(mockPostRecord as PostModel);
      _contentMapper.toDomain.mockReturnValue(mockPostEntity);

      const post = await _contentRepo.findContentById(mockPostId);

      expect(_libContentRepository.findOne).toBeCalledWith({ where: { id: mockPostId } });
      expect(_contentMapper.toDomain).toBeCalledWith(mockPostRecord);
      expect(post).toEqual(mockPostEntity);
    });

    it('Should find content with option success', async () => {
      const mockPostId = mockPostRecord.id;
      _libContentRepository.findOne.mockResolvedValue(mockPostRecord as PostModel);
      _contentMapper.toDomain.mockReturnValue(mockPostEntity);

      const post = await _contentRepo.findContentById(mockPostId, { mustIncludeGroup: true });

      expect(_libContentRepository.findOne).toBeCalledWith({
        where: { id: mockPostId },
        include: { mustIncludeGroup: true },
      });
      expect(_contentMapper.toDomain).toBeCalledWith(mockPostRecord);
      expect(post).toEqual(mockPostEntity);
    });
  });

  describe('findContentByIdInActiveGroup', () => {
    it('Should find content in active group success', async () => {
      const mockPostId = mockPostRecord.id;
      _libContentRepository.findOne.mockResolvedValue(mockPostRecord as PostModel);
      _contentMapper.toDomain.mockReturnValue(mockPostEntity);

      const post = await _contentRepo.findContentByIdInActiveGroup(mockPostId);

      expect(_libContentRepository.findOne).toBeCalledWith({
        where: { id: mockPostId, groupArchived: false },
      });
      expect(_contentMapper.toDomain).toBeCalledWith(mockPostRecord);
      expect(post).toEqual(mockPostEntity);
    });
  });

  describe('findContentByIdInArchivedGroup', () => {
    it('Should find content in archived group success', async () => {
      const mockPostId = mockPostRecord.id;
      _libContentRepository.findOne.mockResolvedValue(mockPostRecord as PostModel);
      _contentMapper.toDomain.mockReturnValue(mockPostEntity);

      const post = await _contentRepo.findContentByIdInArchivedGroup(mockPostId);

      expect(_libContentRepository.findOne).toBeCalledWith({
        where: { id: mockPostId, groupArchived: true },
      });
      expect(_contentMapper.toDomain).toBeCalledWith(mockPostRecord);
      expect(post).toEqual(mockPostEntity);
    });
  });

  describe('findContentByIdExcludeReportedByUserId', () => {
    it('Should find content exclude reported by user success', async () => {
      const mockPostId = mockPostRecord.id;
      const mockUserId = v4();
      _libContentRepository.findOne.mockResolvedValue(mockPostRecord as PostModel);
      _contentMapper.toDomain.mockReturnValue(mockPostEntity);

      const post = await _contentRepo.findContentByIdExcludeReportedByUserId(
        mockPostId,
        mockUserId
      );

      expect(_libContentRepository.findOne).toBeCalledWith({
        where: { id: mockPostId, groupArchived: false, excludeReportedByUserId: mockUserId },
      });
      expect(_contentMapper.toDomain).toBeCalledWith(mockPostRecord);
      expect(post).toEqual(mockPostEntity);
    });
  });

  describe('getContentById', () => {
    it('Should get content success', async () => {
      const mockPostId = mockPostRecord.id;
      _contentRepo.findContentById = jest.fn().mockResolvedValue(mockPostEntity);

      const post = await _contentRepo.getContentById(mockPostId);

      expect(_contentRepo.findContentById).toBeCalledWith(mockPostId);
      expect(post).toEqual(mockPostEntity);
    });

    it('Should get content error', async () => {
      const mockPostId = mockPostRecord.id;
      _contentRepo.findContentById = jest.fn().mockResolvedValue(null);

      try {
        await _contentRepo.getContentById(mockPostId);
      } catch (error) {
        expect(_contentRepo.findContentById).toBeCalledWith(mockPostId);
        expect(error).toEqual(new ContentNotFoundException());
      }
    });
  });

  describe('findAll', () => {
    it('Should find all contents without pagination success', async () => {
      const mockPostIds = [v4(), v4()];
      const mockPostRecords = mockPostIds.map((id) => createMockPostRecord({ id }));
      const mockPostEntities = mockPostRecords.map((post) => createMockPostEntity(post));

      _libContentRepository.findAll.mockResolvedValue(mockPostRecords as PostModel[]);
      _contentMapper.toDomain.mockReturnValueOnce(mockPostEntities[0]);
      _contentMapper.toDomain.mockReturnValueOnce(mockPostEntities[1]);

      const posts = await _contentRepo.findAll({ where: { ids: mockPostIds } });

      expect(_libContentRepository.findAll).toBeCalledWith(
        { where: { ids: mockPostIds } },
        undefined
      );
      expect(_contentMapper.toDomain).toBeCalledTimes(2);
      expect(posts).toEqual(mockPostEntities);
    });

    it('Should find all contents with pagination success', async () => {
      const mockPostIds = [v4(), v4()];
      const mockPostRecords = mockPostIds.map((id) => createMockPostRecord({ id }));
      const mockPostEntities = mockPostRecords.map((post) => createMockPostEntity(post));

      _libContentRepository.findAll.mockResolvedValue(mockPostRecords as PostModel[]);
      _contentMapper.toDomain.mockReturnValueOnce(mockPostEntities[0]);
      _contentMapper.toDomain.mockReturnValueOnce(mockPostEntities[1]);

      const posts = await _contentRepo.findAll(
        { where: { ids: mockPostIds } },
        { limit: 10, offset: 1 }
      );

      expect(_libContentRepository.findAll).toBeCalledWith(
        { where: { ids: mockPostIds } },
        { limit: 10, offset: 1 }
      );
      expect(_contentMapper.toDomain).toBeCalledTimes(2);
      expect(posts).toEqual(mockPostEntities);
    });
  });

  describe('markSeen', () => {
    it('Should mark seen content success', async () => {
      const mockContentId = v4();
      const mockUserId = v4();
      await _contentRepo.markSeen(mockContentId, mockUserId);

      expect(_libContentRepository.bulkCreateSeenPost).toBeCalledWith(
        [{ postId: mockContentId, userId: mockUserId }],
        { ignoreDuplicates: true }
      );
    });
  });

  describe('markSeen', () => {
    it('Should mark read important content success', async () => {
      const mockContentId = v4();
      const mockUserId = v4();
      await _contentRepo.markReadImportant(mockContentId, mockUserId);

      expect(_libContentRepository.bulkCreateReadImportantPost).toBeCalledWith(
        [{ postId: mockContentId, userId: mockUserId }],
        { ignoreDuplicates: true }
      );
    });
  });

  describe('getPagination', () => {
    it('Should get contents with pagination success', async () => {
      _libContentRepository.getPagination.mockResolvedValue({
        rows: [mockPostRecord] as PostModel[],
        meta: { hasNextPage: false, hasPreviousPage: false },
      });
      _contentMapper.toDomain.mockReturnValue(mockPostEntity);

      const posts = await _contentRepo.getPagination({
        where: { type: CONTENT_TYPE.POST },
        limit: 10,
      });

      expect(_libContentRepository.getPagination).toBeCalledWith({
        where: { type: CONTENT_TYPE.POST },
        limit: 10,
      });
      expect(posts).toEqual({
        rows: [mockPostEntity],
        meta: { hasNextPage: false, hasPreviousPage: false },
      });
    });
  });

  describe('getReportedContentIdsByUser', () => {
    it('Should get reported content success', async () => {
      const mockUserId = v4();
      const mockTargetIds = [v4(), v4()];
      const mockReportContents = mockTargetIds.map((targetId) =>
        createMockReportContentDetailRecord({ targetId, createdBy: mockUserId })
      );

      _libContentRepository.getReportedContents.mockResolvedValue(
        mockReportContents as ReportContentDetailModel[]
      );

      const targetIds = await _contentRepo.getReportedContentIdsByUser(mockUserId, [
        CONTENT_TARGET.POST,
      ]);

      expect(_libContentRepository.getReportedContents).toBeCalledWith({
        [Op.and]: [{ createdBy: mockUserId, targetType: [CONTENT_TARGET.POST] }],
      });
      expect(targetIds).toEqual(mockTargetIds);
    });
  });
});
