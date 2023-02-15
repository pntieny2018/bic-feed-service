import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { v4 } from 'uuid';
import { StringHelper } from '../../../../../common/helpers';
import { GroupId } from '../../../../v2-group/domain/model/group';
import { UserId } from '../../../../v2-user/domain/model/user';
import { TagDomainService } from '../../../domain/domain-service';
import { ITagDomainService } from '../../../domain/domain-service/interface';
import { ITagFactory, TagFactory, TAG_FACTORY_TOKEN } from '../../../domain/factory';
import { TagEntity, TagName } from '../../../domain/model/tag';
import { ITagRepository, TAG_REPOSITORY_TOKEN } from '../../../domain/repositoty-interface';
import { TagRepository } from '../../../driven-adapter/repository';
import { userMock } from '../../mock/user.dto.mock';
describe('TagDomainService', () => {
  let domainService: ITagDomainService;
  let repo: ITagRepository;
  let factory: ITagFactory;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TagDomainService,
        {
          provide: TAG_FACTORY_TOKEN,
          useValue: createMock<TagFactory>(),
        },
        {
          provide: TAG_REPOSITORY_TOKEN,
          useValue: createMock<TagRepository>(),
        },
      ],
    }).compile();

    domainService = module.get<TagDomainService>(TagDomainService);
    repo = module.get(TAG_REPOSITORY_TOKEN);
    factory = module.get(TAG_FACTORY_TOKEN);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createTag', () => {
    const tagRecord = {
      id: v4(),
      groupId: v4(),
      name: 'tag bbbdd12 ddffc 1dddf22',
      slug: StringHelper.convertToSlug('tag bbbdd12 ddffc 1dddf22'),
      totalUsed: 0,
      updatedBy: userMock.id,
      createdBy: userMock.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const tagEntity = TagEntity.fromJson(tagRecord);
    it('Should create tag success', async () => {
      jest.spyOn(factory, 'create').mockReturnValue(tagEntity);
      jest.spyOn(repo, 'create').mockResolvedValue(undefined);

      const result = await domainService.createTag({
        name: TagName.fromString(tagRecord.name),
        groupId: GroupId.fromString(tagRecord.groupId),
        userId: UserId.fromString(tagRecord.createdBy),
      });
      expect(factory.create).toBeCalledWith({
        name: TagName.fromString(tagRecord.name),
        groupId: GroupId.fromString(tagRecord.groupId),
        userId: UserId.fromString(tagRecord.createdBy),
      });

      expect(repo.create).toBeCalledWith(tagEntity);
      expect(result).toEqual(tagEntity);
    });
  });
});
