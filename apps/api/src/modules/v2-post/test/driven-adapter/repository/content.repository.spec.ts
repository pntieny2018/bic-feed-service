import { TestBed } from '@automock/jest';
import { createMock } from '@golevelup/ts-jest';
import { getModelToken } from '@nestjs/sequelize';
import { Transaction } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { v4 } from 'uuid';

import { PostGroupModel } from '../../../../../database/models/post-group.model';
import { PostModel } from '../../../../../database/models/post.model';
import { ContentRepository } from '../../../driven-adapter/repository/content.repository';
import {
  createMockContentEntity,
  createMockPostEntity,
  createMockPostRecord,
  createMockSeriesEntity,
} from '../../mock/content.mock';

const transaction = createMock<Transaction>();
const postRecordMock = createMockPostRecord();
const postEntityMock = createMockPostEntity();
const contentEntityMock = createMockContentEntity();
const seriesEntityMock = createMockSeriesEntity();

describe('ContentRepository', () => {
  let repo: ContentRepository;
  let postModel: jest.Mocked<typeof PostModel>;
  let postGroupModel: jest.Mocked<typeof PostGroupModel>;
  let sequelizeConnection: Sequelize;

  beforeEach(async () => {
    const { unit, unitRef } = TestBed.create(ContentRepository).compile();

    repo = unit;
    postModel = unitRef.get(getModelToken(PostModel));
    postGroupModel = unitRef.get(getModelToken(PostGroupModel));
    sequelizeConnection = unitRef.get(Sequelize);
    sequelizeConnection.transaction = jest.fn().mockResolvedValue(transaction);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('Should create post success', async () => {
      const spyCreate = jest.spyOn(postModel, 'create').mockResolvedValue(postRecordMock);
      repo['_entityToModel'] = jest.fn().mockReturnThis();
      repo['_setSeries'] = jest.fn().mockReturnThis();
      repo['_setTags'] = jest.fn().mockReturnThis();
      repo['_setGroups'] = jest.fn().mockReturnThis();
      await repo.create(postEntityMock);

      expect(spyCreate).toBeCalled();
      expect(repo['_entityToModel']).toBeCalledWith(postEntityMock);
      expect(repo['_setSeries']).toBeCalledWith(postEntityMock, transaction);
      expect(repo['_setTags']).toBeCalledWith(postEntityMock, transaction);
      expect(repo['_setGroups']).toBeCalledWith(postEntityMock, transaction);
      expect(transaction.commit).toBeCalled();
    });

    it('Should create series success', async () => {
      const spyCreate = jest.spyOn(postModel, 'create').mockResolvedValue(postRecordMock);
      repo['_entityToModel'] = jest.fn().mockReturnThis();
      repo['_setSeries'] = jest.fn().mockReturnThis();
      repo['_setTags'] = jest.fn().mockReturnThis();
      repo['_setGroups'] = jest.fn().mockReturnThis();
      await repo.create(seriesEntityMock);

      expect(spyCreate).toBeCalled();
      expect(repo['_entityToModel']).toBeCalledWith(seriesEntityMock);
      expect(repo['_setSeries']).toBeCalledTimes(0);
      expect(repo['_setTags']).toBeCalledTimes(0);
      expect(repo['_setGroups']).toBeCalledWith(seriesEntityMock, transaction);
      expect(transaction.commit).toBeCalled();
    });

    it('Should rollback success', async () => {
      const spyCreate = jest.spyOn(postModel, 'create').mockRejectedValue(new Error());
      repo['_entityToModel'] = jest.fn().mockReturnThis();
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
      const spyUpdate = jest.spyOn(postModel, 'update').mockResolvedValue(null);
      repo['_entityToModel'] = jest.fn().mockReturnThis();
      repo['_setSeries'] = jest.fn().mockReturnThis();
      repo['_setTags'] = jest.fn().mockReturnThis();
      repo['_setGroups'] = jest.fn().mockReturnThis();
      await repo.update(postEntityMock);

      expect(spyUpdate).toBeCalled();
      expect(repo['_entityToModel']).toBeCalledWith(postEntityMock);
      expect(repo['_setSeries']).toBeCalledWith(postEntityMock, transaction);
      expect(repo['_setTags']).toBeCalledWith(postEntityMock, transaction);
      expect(repo['_setGroups']).toBeCalledWith(postEntityMock, transaction);
      expect(transaction.commit).toBeCalled();
    });
    it('Should update series success', async () => {
      const spyUpdate = jest.spyOn(postModel, 'update').mockResolvedValue(null);
      repo['_entityToModel'] = jest.fn().mockReturnThis();
      repo['_setSeries'] = jest.fn().mockReturnThis();
      repo['_setTags'] = jest.fn().mockReturnThis();
      repo['_setGroups'] = jest.fn().mockReturnThis();
      await repo.update(seriesEntityMock);

      expect(spyUpdate).toBeCalled();
      expect(repo['_entityToModel']).toBeCalledWith(seriesEntityMock);
      expect(repo['_setSeries']).toBeCalledTimes(0);
      expect(repo['_setTags']).toBeCalledTimes(0);
      expect(repo['_setGroups']).toBeCalledWith(seriesEntityMock, transaction);
      expect(transaction.commit).toBeCalled();
    });
    it('Should rollback success', async () => {
      const spyUpdate = jest.spyOn(postModel, 'update').mockRejectedValue(new Error());
      repo['_entityToModel'] = jest.fn().mockReturnThis();
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
      await repo['_setGroups'](contentEntityMock, transaction);
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
