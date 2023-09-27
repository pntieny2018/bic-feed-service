import { createMock } from '@golevelup/ts-jest';
import { HttpService } from '@nestjs/axios';
import { getModelToken } from '@nestjs/sequelize';
import { Test, TestingModule } from '@nestjs/testing';
import { Transaction } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { v4 } from 'uuid';

import { PostTagModel } from '../../../../../database/models/post-tag.model';
import { TagModel } from '../../../../../database/models/tag.model';
import { TagFactory } from '../../../domain/factory';
import { ITagFactory, TAG_FACTORY_TOKEN } from '../../../domain/factory/interface';
import { TagEntity } from '../../../domain/model/tag';
import { TagRepository } from '../../../driven-adapter/repository';
import { createMockUserDto } from '../../mock/user.mock';

const transaction = createMock<Transaction>();
const userMock = createMockUserDto();

describe('TagRepository', () => {
  let repo, tagModel, postTagModel, sequelizeConnection;
  let factory: ITagFactory;
  let httpService;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TagRepository,
        HttpService,
        {
          provide: TAG_FACTORY_TOKEN,
          useValue: createMock<TagFactory>(),
        },
        {
          provide: getModelToken(TagModel),
          useValue: createMock<TagModel>(),
        },
        {
          provide: getModelToken(PostTagModel),
          useValue: createMock<PostTagModel>(),
        },
        {
          provide: HttpService,
          useValue: createMock<HttpService>(),
        },
        {
          provide: Sequelize,
          useValue: createMock<Sequelize>(),
        },
      ],
    }).compile();

    repo = module.get<TagRepository>(TagRepository);
    httpService = module.get<HttpService>(HttpService);
    factory = module.get(TAG_FACTORY_TOKEN);
    tagModel = module.get<TagModel>(getModelToken(TagModel));
    postTagModel = module.get<PostTagModel>(getModelToken(PostTagModel));
    sequelizeConnection = module.get<Sequelize>(Sequelize);
    sequelizeConnection.transaction.mockResolvedValue(transaction);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
  const tagRecord = {
    id: v4(),
    groupId: v4(),
    name: 'tag bbbdd12 ddffc 1dddf22',
    slug: 'tag-bbbdd12-ddffc-1dddf22',
    totalUsed: 0,
    updatedBy: userMock.id,
    createdBy: userMock.id,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const tagEntity = new TagEntity(tagRecord);
  describe('create', () => {
    it('Should create tag success', async () => {
      jest.spyOn(tagModel, 'create').mockResolvedValue(tagRecord);
      await repo.create(tagEntity);
      expect(tagModel.create).toBeCalledWith({
        id: tagRecord.id,
        groupId: tagRecord.groupId,
        name: 'tag bbbdd12 ddffc 1dddf22',
        slug: 'tag-bbbdd12-ddffc-1dddf22',
        totalUsed: 0,
        updatedBy: userMock.id,
        createdBy: userMock.id,
      });
    });
  });

  describe('update', () => {
    it('Should update tag success', async () => {
      jest.spyOn(tagModel, 'update').mockResolvedValue([1]);
      await repo.update(tagEntity);
      expect(tagModel.update).toBeCalledWith(
        {
          name: 'tag bbbdd12 ddffc 1dddf22',
          slug: 'tag-bbbdd12-ddffc-1dddf22',
          totalUsed: 0,
          updatedBy: userMock.id,
          groupId: tagRecord.groupId,
          createdBy: userMock.id,
        },
        {
          where: {
            id: tagRecord.id,
          },
        }
      );
    });
  });

  describe('delete', () => {
    it('Should delete tag success', async () => {
      const postTagSpy = jest.spyOn(postTagModel, 'destroy').mockResolvedValue(1);
      const tagSpy = jest.spyOn(tagModel, 'destroy').mockResolvedValue(1);
      await repo.delete(tagEntity.get('id'));
      expect(postTagSpy).toBeCalledWith({ where: { tagId: tagEntity.get('id') }, transaction });
      expect(tagSpy).toBeCalledWith({ where: { id: tagEntity.get('id') }, transaction });
      expect(transaction.commit).toBeCalled();
    });

    it('Should not delete tag if delete post tag fail', async () => {
      const logErrorSpy = jest.spyOn(repo['_logger'], 'error').mockReturnThis();
      const postTagSpy = jest.spyOn(postTagModel, 'destroy').mockReturnValue(new Error());
      try {
        await repo.delete(tagEntity.get('id'));
      } catch (error) {
        expect(postTagSpy).toBeCalledWith({ where: { tagId: tagEntity.get('id') } });
        expect(logErrorSpy).toBeCalled();
        expect(error).toBeInstanceOf(Error);
        expect(postTagModel.destroy).toBeCalled();
        expect(tagModel.destroy).not.toBeCalled();
        expect(transaction.rollback).toBeCalled();
      }
    });
  });

  describe('findOne', () => {
    it('Should find one tag success', async () => {
      jest.spyOn(tagModel, 'findOne').mockResolvedValue({ toJSON: () => tagRecord });
      jest.spyOn(factory, 'reconstitute').mockReturnValue(tagEntity);
      const result = await repo.findOne({ id: tagEntity.get('id') });
      expect(tagModel.findOne).toBeCalledWith({
        attributes: TagModel.loadAllAttributes(),
        where: {
          id: tagEntity.get('id'),
        },
      });
      expect(result).toEqual(tagEntity);
    });
  });

  describe('findAll', () => {
    it('Should find all tag success', async () => {
      jest.spyOn(tagModel, 'findAll').mockResolvedValue([{ toJSON: () => tagRecord }]);
      jest.spyOn(factory, 'reconstitute').mockReturnValue(new TagEntity(tagRecord));
      const result = await repo.findAll({ groupIds: [tagEntity.get('id')] });
      expect(tagModel.findAll).toBeCalledWith({
        where: {
          groupId: [tagEntity.get('id')],
        },
      });
      expect(result).toEqual([new TagEntity(tagRecord)]);
    });
  });
});
