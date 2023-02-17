import { createMock } from '@golevelup/ts-jest';
import { getModelToken } from '@nestjs/sequelize';
import { Test, TestingModule } from '@nestjs/testing';
import { v4 } from 'uuid';
import { PostTagModel } from '../../../../../database/models/post-tag.model';
import { TagModel } from '../../../../../database/models/tag.model';
import { TagEntity } from '../../../domain/model/tag';
import { TagRepository } from '../../../driven-adapter/repository';
import { userMock } from '../../mock/user.dto.mock';
import { Sequelize } from 'sequelize-typescript';
import { InternalServerErrorException } from '@nestjs/common';

describe('TagRepository', () => {
  let repo, tagModel, postTagModel, sequelizeConnection;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TagRepository,
        {
          provide: getModelToken(TagModel),
          useValue: createMock<TagModel>(),
        },
        {
          provide: getModelToken(PostTagModel),
          useValue: createMock<PostTagModel>(),
        },
        {
          provide: Sequelize,
          useValue: {
            transaction: jest.fn(async () => ({
              commit: jest.fn(),
              rollback: jest.fn(),
            })),
          },
        },
      ],
    }).compile();

    repo = module.get<TagRepository>(TagRepository);
    tagModel = module.get<TagModel>(getModelToken(TagModel));
    postTagModel = module.get<PostTagModel>(getModelToken(PostTagModel));
    sequelizeConnection = module.get<Sequelize>(Sequelize);
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
  const tagEntity = TagEntity.fromJson(tagRecord);

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
      jest.spyOn(postTagModel, 'destroy').mockResolvedValue(1);
      jest.spyOn(tagModel, 'destroy').mockResolvedValue(1);
      await repo.delete(tagEntity.id);
      expect(postTagModel.destroy).toBeCalled();
      expect(tagModel.destroy).toBeCalled();
    });

    it('Should not delete tag if delete post tag fail', async () => {
      jest.spyOn(postTagModel, 'destroy').mockRejectedValue(new Error('error'));
      try {
        await repo.delete(tagEntity.id);
      } catch (error) {
        expect(error).toBeInstanceOf(InternalServerErrorException);
        expect(error.message).toBe('Internal Server Error');
        expect(postTagModel.destroy).toBeCalled();
        expect(tagModel.destroy).not.toBeCalled();
      }
    });
  });

  describe('findOne', () => {
    it('Should find one tag success', async () => {
      jest.spyOn(tagModel, 'findOne').mockResolvedValue(tagRecord);
      const result = await repo.findOne({ id: tagEntity.id });
      expect(tagModel.findOne).toBeCalledWith({
        where: {
          id: tagEntity.id.value,
        },
      });
      expect(result).toEqual(tagEntity);
    });
  });

  describe('findAll', () => {
    it('Should find all tag success', async () => {
      jest.spyOn(tagModel, 'findAll').mockResolvedValue([tagRecord]);
      const result = await repo.findAll({ groupIds: [tagEntity.id] });
      expect(tagModel.findAll).toBeCalledWith({
        where: {
          groupId: [tagEntity.id.value],
        },
      });
      expect(result).toEqual([tagEntity]);
    });
  });
});
