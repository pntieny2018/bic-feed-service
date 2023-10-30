/* eslint-disable @typescript-eslint/unbound-method */
import { TestBed } from '@automock/jest';
import { CONTENT_STATUS, CONTENT_TARGET, CONTENT_TYPE, ORDER, PRIVACY } from '@beincom/constants';
import { createMock } from '@golevelup/ts-jest';
import { PostGroupModel } from '@libs/database/postgres/model';
import { PostAttributes, PostModel } from '@libs/database/postgres/model/post.model';
import { ReportContentDetailModel } from '@libs/database/postgres/model/report-content-detail.model';
import {
  LibContentRepository,
  LibPostCategoryRepository,
  LibPostGroupRepository,
  LibPostSeriesRepository,
  LibPostTagRepository,
  LibUserMarkReadPostRepository,
  LibUserReportContentRepository,
  LibUserSavePostRepository,
  LibUserSeenPostRepository,
} from '@libs/database/postgres/repository';
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
import { ContentMapper } from '../../../driven-adapter/mapper/content.mapper';
import { ContentRepository } from '../../../driven-adapter/repository/content.repository';
import {
  createMockCategoryEntity,
  createMockReportContentDetailRecord,
  createMockTagEntity,
  createMockTagRecord,
} from '../../mock';
import {
  createMockArticleEntity,
  createMockArticleRecord,
  createMockContentEntity,
  createMockPostEntity,
  createMockPostGroupRecord,
  createMockPostRecord,
  createMockPostSeriesRecord,
  createMockSeriesEntity,
  createMockSeriesRecord,
} from '../../mock/content.mock';

describe('ContentRepository', () => {
  let _contentRepo: ContentRepository;
  let _libContentRepo: jest.Mocked<LibContentRepository>;
  let _libPostTagRepo: jest.Mocked<LibPostTagRepository>;
  let _libPostSeriesRepo: jest.Mocked<LibPostSeriesRepository>;
  let _libPostGroupRepo: jest.Mocked<LibPostGroupRepository>;
  let _libPostCategoryRepo: jest.Mocked<LibPostCategoryRepository>;
  let _libUserSeenPostRepo: jest.Mocked<LibUserSeenPostRepository>;
  let _libUserMarkReadPostRepo: jest.Mocked<LibUserMarkReadPostRepository>;
  let _libUserReportContentRepo: jest.Mocked<LibUserReportContentRepository>;
  let _libUserSavePostRepo: jest.Mocked<LibUserSavePostRepository>;
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
    _libContentRepo = unitRef.get(LibContentRepository);
    _libPostTagRepo = unitRef.get(LibPostTagRepository);
    _libPostSeriesRepo = unitRef.get(LibPostSeriesRepository);
    _libPostGroupRepo = unitRef.get(LibPostGroupRepository);
    _libPostCategoryRepo = unitRef.get(LibPostCategoryRepository);
    _libUserSeenPostRepo = unitRef.get(LibUserSeenPostRepository);
    _libUserMarkReadPostRepo = unitRef.get(LibUserMarkReadPostRepository);
    _libUserReportContentRepo = unitRef.get(LibUserReportContentRepository);
    _libUserSavePostRepo = unitRef.get(LibUserSavePostRepository);
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
      expect(_libContentRepo.create).toBeCalledWith(mockPostRecord, { transaction });
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
      expect(_libContentRepo.create).toBeCalledWith(mockArticleRecord, { transaction });
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
      expect(_libContentRepo.create).toBeCalledWith(mockSeriesRecord, { transaction });
      expect(_contentRepo['_setSeries']).not.toBeCalled();
      expect(_contentRepo['_setTags']).not.toBeCalled();
      expect(_contentRepo['_setGroups']).toBeCalledWith(mockSeriesEntity, transaction);
      expect(transaction.commit).toBeCalled();
      expect(transaction.rollback).not.toBeCalled();
    });

    it('Should rollback success', async () => {
      _contentMapper.toPersistence.mockReturnValue(mockPostRecord);
      _libContentRepo.create.mockRejectedValue(new Error());

      try {
        await _contentRepo.create(mockPostEntity);
      } catch (e) {
        expect(_contentMapper.toPersistence).toBeCalledWith(mockPostEntity);
        expect(_libContentRepo.create).toBeCalledWith(mockPostRecord, { transaction });
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
      expect(_libContentRepo.update).toBeCalledWith(mockPostRecord, {
        where: { id: mockPostRecord.id },
        transaction,
      });
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
      expect(_libContentRepo.update).toBeCalledWith(mockArticleRecord, {
        where: { id: mockArticleRecord.id },
        transaction,
      });
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
      expect(_libContentRepo.update).toBeCalledWith(mockSeriesRecord, {
        where: { id: mockSeriesRecord.id },
        transaction,
      });
      expect(_contentRepo['_setSeries']).not.toBeCalled();
      expect(_contentRepo['_setTags']).not.toBeCalled();
      expect(_contentRepo['_setCategories']).not.toBeCalled();
      expect(_contentRepo['_setGroups']).toBeCalledWith(mockSeriesEntity, transaction);
      expect(transaction.commit).toBeCalled();
      expect(transaction.rollback).not.toBeCalled();
    });

    it('Should rollback success', async () => {
      _contentMapper.toPersistence.mockReturnValue(mockPostRecord);
      _libContentRepo.update.mockRejectedValue(new Error());

      try {
        await _contentRepo.update(mockPostEntity);
      } catch (e) {
        expect(_contentMapper.toPersistence).toBeCalledWith(mockPostEntity);
        expect(_libContentRepo.update).toBeCalledWith(mockPostRecord, {
          where: { id: mockPostRecord.id },
          transaction,
        });
        expect(_contentRepo['_setSeries']).not.toBeCalled();
        expect(_contentRepo['_setTags']).not.toBeCalled();
        expect(_contentRepo['_setCategories']).not.toBeCalled();
        expect(_contentRepo['_setGroups']).not.toBeCalled();
        expect(transaction.commit).not.toBeCalled();
        expect(transaction.rollback).toBeCalled();
      }
    });
  });

  describe('updateContentPrivacy', () => {
    it('Should update content privacy success', async () => {
      const mockContentIds = [v4(), v4()];
      const mockPrivacy = PRIVACY.PRIVATE;

      await _contentRepo.updateContentPrivacy(mockContentIds, mockPrivacy);

      expect(_libContentRepo.update).toBeCalledWith(
        { privacy: mockPrivacy },
        { where: { id: mockContentIds } }
      );
    });
  });

  describe('_setGroups', () => {
    it('Should add and delete groups success', async () => {
      const mockAttachGroupIds = [v4()];
      const mockDetachGroupIds = mockContentEntity.getGroupIds();

      mockContentEntity.setGroups(mockAttachGroupIds);

      await _contentRepo['_setGroups'](mockContentEntity, transaction);

      expect(_libPostGroupRepo.bulkCreate).toBeCalledWith(
        mockAttachGroupIds.map((groupId) => ({ postId: mockContentEntity.getId(), groupId })),
        { transaction, ignoreDuplicates: true }
      );
      expect(_libPostGroupRepo.delete).toBeCalledWith({
        where: { postId: mockContentEntity.getId(), groupId: mockDetachGroupIds },
        transaction,
      });
    });
  });

  describe('_setSeries', () => {
    it('Should add and delete series success', async () => {
      const mockPostEntity = createMockPostEntity({ postSeries: [createMockPostSeriesRecord()] });
      const mockAttachSeriesIds = [v4()];
      const mockDetachSeriesIds = mockPostEntity.getSeriesIds();

      mockPostEntity.updateAttribute({ seriesIds: mockAttachSeriesIds }, v4());

      await _contentRepo['_setSeries'](mockPostEntity, transaction);

      expect(_libPostSeriesRepo.bulkCreate).toBeCalledWith(
        mockAttachSeriesIds.map((seriesId) => ({
          postId: mockPostEntity.getId(),
          seriesId,
          zindex: 1,
        })),
        { transaction, ignoreDuplicates: true }
      );
      expect(_libPostSeriesRepo.delete).toBeCalledWith({
        where: { postId: mockPostEntity.getId(), seriesId: mockDetachSeriesIds },
        transaction,
      });
    });
  });

  describe('_setTags', () => {
    it('Should add and delete tags success', async () => {
      const mockArticleEntity = createMockArticleEntity({ tagsJson: [createMockTagRecord()] });
      const mockAttachTagIds = [v4()];
      const mockDetachTagIds = mockArticleEntity.get('tags').map((tag) => tag.get('id'));

      mockArticleEntity.setTags(
        mockAttachTagIds.map((tagId) => createMockTagEntity({ id: tagId }))
      );

      await _contentRepo['_setTags'](mockArticleEntity, transaction);

      expect(_libPostTagRepo.bulkCreate).toBeCalledWith(
        mockAttachTagIds.map((tagId) => ({ postId: mockArticleEntity.getId(), tagId })),
        { transaction, ignoreDuplicates: true }
      );
      expect(_libPostTagRepo.delete).toBeCalledWith({
        where: { postId: mockArticleEntity.getId(), tagId: mockDetachTagIds },
        transaction,
      });
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

      expect(_libPostCategoryRepo.bulkCreate).toBeCalledWith(
        mockAttachCategoryIds.map((categoryId) => ({
          postId: mockArticleEntity.getId(),
          categoryId,
        })),
        { transaction, ignoreDuplicates: true }
      );
      expect(_libPostCategoryRepo.delete).toBeCalledWith({
        where: {
          postId: mockArticleEntity.getId(),
          categoryId: mockDetachCategoryIds,
        },
        transaction,
      });
    });
  });

  describe('delete', () => {
    it('Should delete content success', async () => {
      const mockContentId = v4();
      await _contentRepo.delete(mockContentId);

      expect(_libContentRepo.delete).toBeCalledWith({ where: { id: mockContentId }, force: true });
    });
  });

  describe('findContentById', () => {
    it('Should find content without option success', async () => {
      const mockPostId = mockPostRecord.id;
      _libContentRepo.findOne.mockResolvedValue(mockPostRecord as PostModel);
      _contentMapper.toDomain.mockReturnValue(mockPostEntity);

      const post = await _contentRepo.findContentById(mockPostId);

      expect(_libContentRepo.findOne).toBeCalledWith({ where: { id: mockPostId } });
      expect(_contentMapper.toDomain).toBeCalledWith(mockPostRecord);
      expect(post).toEqual(mockPostEntity);
    });

    it('Should find content with option success', async () => {
      const mockPostId = mockPostRecord.id;
      _libContentRepo.findOne.mockResolvedValue(mockPostRecord as PostModel);
      _contentMapper.toDomain.mockReturnValue(mockPostEntity);

      const post = await _contentRepo.findContentById(mockPostId, { mustIncludeGroup: true });

      expect(_libContentRepo.findOne).toBeCalledWith({
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
      _libContentRepo.findOne.mockResolvedValue(mockPostRecord as PostModel);
      _contentMapper.toDomain.mockReturnValue(mockPostEntity);

      const post = await _contentRepo.findContentByIdInActiveGroup(mockPostId);

      expect(_libContentRepo.findOne).toBeCalledWith({
        where: { id: mockPostId, groupArchived: false },
      });
      expect(_contentMapper.toDomain).toBeCalledWith(mockPostRecord);
      expect(post).toEqual(mockPostEntity);
    });
  });

  describe('findContentByIdInArchivedGroup', () => {
    it('Should find content in archived group success', async () => {
      const mockPostId = mockPostRecord.id;
      _libContentRepo.findOne.mockResolvedValue(mockPostRecord as PostModel);
      _contentMapper.toDomain.mockReturnValue(mockPostEntity);

      const post = await _contentRepo.findContentByIdInArchivedGroup(mockPostId);

      expect(_libContentRepo.findOne).toBeCalledWith({
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
      _libContentRepo.findOne.mockResolvedValue(mockPostRecord as PostModel);
      _contentMapper.toDomain.mockReturnValue(mockPostEntity);

      const post = await _contentRepo.findContentByIdExcludeReportedByUserId(
        mockPostId,
        mockUserId
      );

      expect(_libContentRepo.findOne).toBeCalledWith({
        where: { id: mockPostId, groupArchived: false, excludeReportedByUserId: mockUserId },
      });
      expect(_contentMapper.toDomain).toBeCalledWith(mockPostRecord);
      expect(post).toEqual(mockPostEntity);
    });
  });

  describe('findAll', () => {
    it('Should find all contents without pagination success', async () => {
      const mockPostIds = [v4(), v4()];
      const mockPostRecords = mockPostIds.map((id) => createMockPostRecord({ id }));
      const mockPostEntities = mockPostRecords.map((post) => createMockPostEntity(post));

      _libContentRepo.findAll.mockResolvedValue(mockPostRecords as PostModel[]);
      _contentMapper.toDomain.mockReturnValueOnce(mockPostEntities[0]);
      _contentMapper.toDomain.mockReturnValueOnce(mockPostEntities[1]);

      const posts = await _contentRepo.findAll({ where: { ids: mockPostIds } });

      expect(_libContentRepo.findAll).toBeCalledWith({ where: { ids: mockPostIds } }, undefined);
      expect(_contentMapper.toDomain).toBeCalledTimes(2);
      expect(posts).toEqual(mockPostEntities);
    });

    it('Should find all contents with pagination success', async () => {
      const mockPostIds = [v4(), v4()];
      const mockPostRecords = mockPostIds.map((id) => createMockPostRecord({ id }));
      const mockPostEntities = mockPostRecords.map((post) => createMockPostEntity(post));

      _libContentRepo.findAll.mockResolvedValue(mockPostRecords as PostModel[]);
      _contentMapper.toDomain.mockReturnValueOnce(mockPostEntities[0]);
      _contentMapper.toDomain.mockReturnValueOnce(mockPostEntities[1]);

      const posts = await _contentRepo.findAll(
        { where: { ids: mockPostIds } },
        { limit: 10, offset: 1 }
      );

      expect(_libContentRepo.findAll).toBeCalledWith(
        { where: { ids: mockPostIds } },
        { limit: 10, offset: 1 }
      );
      expect(_contentMapper.toDomain).toBeCalledTimes(2);
      expect(posts).toEqual(mockPostEntities);
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

  describe('getPagination', () => {
    it('Should get contents with pagination success', async () => {
      _libContentRepo.getPagination.mockResolvedValue({
        rows: [mockPostRecord] as PostModel[],
        meta: { hasNextPage: false, hasPreviousPage: false },
      });
      _contentMapper.toDomain.mockReturnValue(mockPostEntity);

      const posts = await _contentRepo.getPagination({
        where: { type: CONTENT_TYPE.POST },
        limit: 10,
      });

      expect(_libContentRepo.getPagination).toBeCalledWith({
        where: { type: CONTENT_TYPE.POST },
        limit: 10,
      });
      expect(posts).toEqual({
        rows: [mockPostEntity],
        meta: { hasNextPage: false, hasPreviousPage: false },
      });
    });
  });

  describe('countDraftContentByUserId', () => {
    it('Should count draft content success', async () => {
      const mockUserId = v4();

      _libContentRepo.count.mockResolvedValue(10);

      const totalDraftContent = await _contentRepo.countDraftContentByUserId(mockUserId);

      expect(_libContentRepo.count).toBeCalledWith({
        where: { createdBy: mockUserId, status: CONTENT_STATUS.DRAFT },
      });
      expect(totalDraftContent).toEqual(10);
    });
  });

  describe('markSeen', () => {
    it('Should mark seen content success', async () => {
      const mockContentId = v4();
      const mockUserId = v4();
      await _contentRepo.markSeen(mockContentId, mockUserId);

      expect(_libUserSeenPostRepo.bulkCreate).toBeCalledWith(
        [{ postId: mockContentId, userId: mockUserId }],
        { ignoreDuplicates: true }
      );
    });
  });

  describe('hasSeen', () => {
    it('Should get has seen content success', async () => {
      const mockContentId = v4();
      const mockUserId = v4();

      _libUserSeenPostRepo.first.mockResolvedValue(null);

      const hasSeen = await _contentRepo.hasSeen(mockContentId, mockUserId);

      expect(_libUserSeenPostRepo.first).toBeCalledWith({
        where: { postId: mockContentId, userId: mockUserId },
      });
      expect(hasSeen).toEqual(false);
    });
  });

  describe('markReadImportant', () => {
    it('Should mark read important content success', async () => {
      const mockContentId = v4();
      const mockUserId = v4();
      await _contentRepo.markReadImportant(mockContentId, mockUserId);

      expect(_libUserMarkReadPostRepo.bulkCreate).toBeCalledWith(
        [{ postId: mockContentId, userId: mockUserId }],
        { ignoreDuplicates: true }
      );
    });
  });

  describe('getReportedContentIdsByUser', () => {
    it('Should get reported content success', async () => {
      const mockUserId = v4();
      const mockTargetIds = [v4(), v4()];
      const mockReportContents = mockTargetIds.map((targetId) =>
        createMockReportContentDetailRecord({ targetId, createdBy: mockUserId })
      );

      _libUserReportContentRepo.findMany.mockResolvedValue(
        mockReportContents as ReportContentDetailModel[]
      );

      const targetIds = await _contentRepo.getReportedContentIdsByUser({
        reportUser: mockUserId,
        target: [CONTENT_TARGET.POST],
      });

      expect(_libUserReportContentRepo.findMany).toBeCalledWith({
        where: {
          [Op.and]: [{ createdBy: mockUserId, targetType: [CONTENT_TARGET.POST] }],
        },
      });
      expect(targetIds).toEqual(mockTargetIds);
    });
  });

  describe('findUserIdsReportedTargetId', () => {
    it('Should find user ids reported with target type success', async () => {
      const mockTargetId = v4();
      const mockTargetType = CONTENT_TARGET.POST;

      const mockUserIds = [v4(), v4()];
      const mockReportContents = mockUserIds.map((userId) =>
        createMockReportContentDetailRecord({ targetId: mockTargetId, createdBy: userId })
      );

      _libUserReportContentRepo.findMany.mockResolvedValue(
        mockReportContents as ReportContentDetailModel[]
      );

      const userIds = await _contentRepo.findUserIdsReportedTargetId(mockTargetId, mockTargetType);

      expect(_libUserReportContentRepo.findMany).toBeCalledWith({
        where: {
          [Op.and]: [{ targetId: mockTargetId, targetType: mockTargetType }],
        },
      });
      expect(userIds).toEqual(mockUserIds);
    });
  });

  describe('findPinnedContentIdsByGroupId', () => {
    it('Should find pined content ids success', async () => {
      const mockGroupId = v4();
      const mockPinedContentIds = [v4(), v4()];
      const mockPostGroupRecords = mockPinedContentIds.map((contentId, index) =>
        createMockPostGroupRecord({
          postId: contentId,
          groupId: mockGroupId,
          isPinned: true,
          pinnedIndex: index,
        })
      );

      _libPostGroupRepo.findMany.mockResolvedValue(mockPostGroupRecords as PostGroupModel[]);

      const contentIds = await _contentRepo.findPinnedContentIdsByGroupId(mockGroupId);

      expect(_libPostGroupRepo.findMany).toBeCalledWith({
        where: { groupId: mockGroupId, isPinned: true },
        order: [['pinned_index', 'ASC']],
        include: [
          {
            model: PostModel,
            as: 'post',
            required: true,
            select: [],
            where: {
              status: CONTENT_STATUS.PUBLISHED,
              isHidden: false,
            },
          },
        ],
      });
      expect(contentIds).toEqual(mockPinedContentIds);
    });
  });

  describe('reorderPinnedContent', () => {
    it('Should reorder pinned content success', async () => {
      const mockGroupId = v4();
      const mockContentIds = [v4(), v4()];

      await _contentRepo.reorderPinnedContent(mockContentIds, mockGroupId);

      expect(_libPostGroupRepo.update).toBeCalledWith(
        { pinnedIndex: 1 },
        { where: { groupId: mockGroupId, postId: mockContentIds[0] } }
      );
      expect(_libPostGroupRepo.update).toBeCalledWith(
        { pinnedIndex: 2 },
        { where: { groupId: mockGroupId, postId: mockContentIds[1] } }
      );
    });
  });

  describe('pinContent', () => {
    it('Should pin content success', async () => {
      const mockContentId = v4();
      const mockGroupIds = [v4(), v4()];

      _libPostGroupRepo.max.mockResolvedValue(5);

      await _contentRepo.pinContent(mockContentId, mockGroupIds);

      expect(_libPostGroupRepo.max).toBeCalledTimes(mockGroupIds.length);
      expect(_libPostGroupRepo.update).toBeCalledWith(
        { isPinned: true, pinnedIndex: 6 },
        { where: { postId: mockContentId, groupId: mockGroupIds[0] } }
      );
      expect(_libPostGroupRepo.update).toBeCalledWith(
        { isPinned: true, pinnedIndex: 6 },
        { where: { postId: mockContentId, groupId: mockGroupIds[1] } }
      );
    });
  });

  describe('unpinContent', () => {
    it('Should unpin content success', async () => {
      const mockContentId = v4();
      const mockGroupIds = [v4(), v4()];

      await _contentRepo.unpinContent(mockContentId, mockGroupIds);

      expect(_libPostGroupRepo.update).toBeCalledWith(
        { isPinned: false, pinnedIndex: 0 },
        { where: { postId: mockContentId, groupId: mockGroupIds } }
      );
    });

    it('Should not update pinned if groupId is empty', async () => {
      const mockContentId = v4();
      const mockGroupIds = [];

      await _contentRepo.unpinContent(mockContentId, mockGroupIds);

      expect(_libPostGroupRepo.update).not.toBeCalled();
    });
  });

  describe('saveContent', () => {
    it('Should save content success', async () => {
      const mockUserId = v4();
      const mockContentId = v4();

      await _contentRepo.saveContent(mockUserId, mockContentId);

      expect(_libUserSavePostRepo.bulkCreate).toBeCalledWith(
        [{ userId: mockUserId, postId: mockContentId }],
        { ignoreDuplicates: true }
      );
    });
  });

  describe('createPostSeries', () => {
    it('Should create post series success', async () => {
      const mockSeriesId = v4();
      const mockContentId = v4();

      _libPostSeriesRepo.max.mockResolvedValue(5);

      await _contentRepo.createPostSeries(mockSeriesId, mockContentId);

      expect(_libPostSeriesRepo.max).toBeCalledWith('zindex', {
        where: { seriesId: mockSeriesId },
      });
      expect(_libPostSeriesRepo.bulkCreate).toBeCalledWith(
        [{ seriesId: mockSeriesId, postId: mockContentId, zindex: 6 }],
        { ignoreDuplicates: true }
      );
    });
  });

  describe('deletePostSeries', () => {
    it('Should delete post series success', async () => {
      const mockSeriesId = v4();
      const mockContentId = v4();

      await _contentRepo.deletePostSeries(mockSeriesId, mockContentId);

      expect(_libPostSeriesRepo.delete).toBeCalledWith({
        where: { seriesId: mockSeriesId, postId: mockContentId },
      });
    });
  });

  describe('reorderPostsSeries', () => {
    it('Should reorder post series success', async () => {
      const mockSeriesId = v4();
      const mockItemIds = [v4(), v4()];

      await _contentRepo.reorderPostsSeries(mockSeriesId, mockItemIds);

      expect(_libPostSeriesRepo.update).toBeCalledWith(
        { zindex: 0 },
        { where: { seriesId: mockSeriesId, postId: mockItemIds[0] } }
      );
      expect(_libPostSeriesRepo.update).toBeCalledWith(
        { zindex: 1 },
        { where: { seriesId: mockSeriesId, postId: mockItemIds[1] } }
      );
    });
  });

  describe('findContentIdsByGroupId', () => {
    it('Should find content ids success', async () => {
      const mockGroupId = v4();
      const mockContentIds = [v4(), v4()];
      const mockPostRecords = mockContentIds.map((contentId) =>
        createMockPostRecord({ id: contentId })
      );

      _libContentRepo.findMany.mockResolvedValue(mockPostRecords as PostModel[]);

      const contentIds = await _contentRepo.findContentIdsByGroupId(mockGroupId);

      expect(_libContentRepo.findMany).toBeCalledWith({
        select: ['id'],
        where: { status: CONTENT_STATUS.PUBLISHED, isHidden: false },
        include: [
          {
            model: _libPostGroupRepo.getModel(),
            as: 'groups',
            required: true,
            select: ['groupId'],
            where: { groupId: mockGroupId, isArchived: false },
          },
        ],
        limit: 1000,
        order: [['createdAt', ORDER.DESC]],
      });
      expect(contentIds).toEqual(mockContentIds);
    });
  });

  describe('findContentGroupsByContentIds', () => {
    it('Should find content group success', async () => {
      const mockContentIds = [v4(), v4()];
      const mockContentGroups = mockContentIds.map((contentId) => ({ contentId, groupId: v4() }));
      const mockPostGroupRecords = mockContentGroups.map(({ contentId, groupId }) =>
        createMockPostGroupRecord({ postId: contentId, groupId })
      );

      _libPostGroupRepo.findMany.mockResolvedValue(mockPostGroupRecords as PostGroupModel[]);

      const result = await _contentRepo.findContentGroupsByContentIds(mockContentIds);

      expect(_libPostGroupRepo.findMany).toBeCalledWith({
        where: { postId: mockContentIds },
      });
      expect(result).toEqual(mockContentGroups);
    });
  });
});
