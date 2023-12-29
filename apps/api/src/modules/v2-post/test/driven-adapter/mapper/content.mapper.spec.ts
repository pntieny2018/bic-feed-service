/* eslint-disable unused-imports/no-unused-vars */
import { TestBed } from '@automock/jest';
import { PostAttributes, PostModel } from '@libs/database/postgres/model';

import { ArticleEntity, PostEntity, SeriesEntity } from '../../../domain/model/content';
import { ContentMapper } from '../../../driven-adapter/mapper/content.mapper';
import {
  createMockArticleEntity,
  createMockArticleRecord,
  createMockPostEntity,
  createMockPostRecord,
  createMockSeriesEntity,
  createMockSeriesRecord,
} from '../../mock';

describe('ContentMapper', () => {
  let _contentMapper: ContentMapper;

  let mockPostRecord: PostAttributes;
  let mockArticleRecord: PostAttributes;
  let mockSeriesRecord: PostAttributes;
  let mockPostEntity: PostEntity;
  let mockArticleEntity: ArticleEntity;
  let mockSeriesEntity: SeriesEntity;

  beforeEach(async () => {
    const { unit } = TestBed.create(ContentMapper).compile();

    _contentMapper = unit;

    mockPostRecord = createMockPostRecord();
    mockArticleRecord = createMockArticleRecord();
    mockSeriesRecord = createMockSeriesRecord();
    mockPostEntity = createMockPostEntity(mockPostRecord);
    mockArticleEntity = createMockArticleEntity(mockArticleRecord);
    mockSeriesEntity = createMockSeriesEntity(mockSeriesRecord);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('toDomain', () => {
    it('Should map post model to entity success', async () => {
      const mockPostModel = { ...mockPostRecord, toJSON: () => mockPostRecord } as PostModel;

      const postEntity = _contentMapper.toDomain(mockPostModel);

      expect(postEntity).toEqual(mockPostEntity);
    });

    it('Should map article model to entity success', async () => {
      const mockArticleModel = {
        ...mockArticleRecord,
        toJSON: () => mockArticleRecord,
      } as PostModel;

      const articleEntity = _contentMapper.toDomain(mockArticleModel);

      expect(articleEntity).toEqual(mockArticleEntity);
    });

    it('Should map seriesSeries model to entity success', async () => {
      const mockSeriesModel = {
        ...mockSeriesRecord,
        toJSON: () => mockSeriesRecord,
      } as PostModel;

      const seriesEntity = _contentMapper.toDomain(mockSeriesModel);

      expect(seriesEntity).toEqual(mockSeriesEntity);
    });

    it('Should return null if post model is null', async () => {
      const entity = _contentMapper.toDomain(null);

      expect(entity).toBeNull();
    });
  });

  describe('toPersistence', () => {
    it('Should map post entity to record success', async () => {
      const postRecord = _contentMapper.toPersistence(mockPostEntity);

      const {
        groups,
        isSaved,
        isSeen,
        itemIds,
        markedReadPost,
        ownerReactions,
        postSeries,
        quiz,
        quizResults,
        categories,
        ...mockPostRecordResult
      } = mockPostRecord;

      expect(postRecord).toEqual(mockPostRecordResult);
    });

    it('Should map article entity to record success', async () => {
      const articleRecord = _contentMapper.toPersistence(mockArticleEntity);

      const {
        groups,
        isSaved,
        isSeen,
        itemIds,
        markedReadPost,
        ownerReactions,
        postSeries,
        quiz,
        quizResults,
        categories,
        ...mockArticleRecordResult
      } = mockArticleRecord;

      expect(articleRecord).toEqual(mockArticleRecordResult);
    });

    it('Should map series entity to record success', async () => {
      const seriesRecord = _contentMapper.toPersistence(mockSeriesEntity);

      const {
        groups,
        isSaved,
        isSeen,
        itemIds,
        markedReadPost,
        ownerReactions,
        postSeries,
        quiz,
        quizResults,
        categories,
        ...mockSeriesRecordResult
      } = mockSeriesRecord;

      expect(seriesRecord).toEqual(mockSeriesRecordResult);
    });
  });

  describe('_modelToPostEntity', () => {
    it('Should map post record to entity success', async () => {
      const postEntity = _contentMapper['_modelToPostEntity'](mockPostRecord);

      expect(postEntity).toEqual(mockPostEntity);
    });
  });

  describe('_modelToArticleEntity', () => {
    it('Should map article record to entity success', async () => {
      const articleEntity = _contentMapper['_modelToArticleEntity'](mockArticleRecord);

      expect(articleEntity).toEqual(mockArticleEntity);
    });
  });

  describe('_modelToSeriesEntity', () => {
    it('Should map article record to entity success', async () => {
      const seriesEntity = _contentMapper['_modelToSeriesEntity'](mockSeriesRecord);

      expect(seriesEntity).toEqual(mockSeriesEntity);
    });
  });
});
