import { createMock } from '@golevelup/ts-jest';
import { getModelToken } from '@nestjs/sequelize';
import { Test, TestingModule } from '@nestjs/testing';
import { v4 } from 'uuid';
import { PostTagModel } from '../../../../../database/models/post-tag.model';
import { TagModel } from '../../../../../database/models/tag.model';
import { TagEntity } from '../../../domain/model/tag';
import { TagRepository } from '../../../driven-adapter/repository';
import { userMock } from '../../mock/user.dto.mock';
describe('TagRepository', () => {
  let repo, tagModel, postTagModel;
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
      ],
    }).compile();

    repo = module.get<TagRepository>(TagRepository);
    tagModel = module.get<TagModel>(getModelToken(TagModel));
    postTagModel = module.get<PostTagModel>(getModelToken(PostTagModel));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
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
    it('Should create tag success', async () => {
      jest.spyOn(tagModel, 'create').mockResolvedValue(tagRecord);
      await repo.create(tagEntity);
      expect(tagModel.create).toBeCalledWith({
        id: v4(),
        groupId: v4(),
        name: 'tag bbbdd12 ddffc 1dddf22',
        slug: 'tag-bbbdd12-ddffc-1dddf22',
        totalUsed: 0,
        updatedBy: userMock.id,
        createdBy: userMock.id,
      });
    });
  });
});
