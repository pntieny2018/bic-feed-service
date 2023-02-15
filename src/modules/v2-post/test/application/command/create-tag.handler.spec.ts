import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { v4 } from 'uuid';
import { StringHelper } from '../../../../../common/helpers';
import { GroupId } from '../../../../v2-group/domain/model/group';
import { UserId } from '../../../../v2-user/domain/model/user';
import { CreateTagCommand } from '../../../application/command/create-tag/create-tag.command';
import { CreateTagHandler } from '../../../application/command/create-tag/create-tag.handler';
import { TagDomainService } from '../../../domain/domain-service';
import { ITagDomainService, TAG_DOMAIN_SERVICE_TOKEN } from '../../../domain/domain-service/interface';
import { TagFactory, TAG_FACTORY_TOKEN } from '../../../domain/factory';
import { TagEntity, TagName } from '../../../domain/model/tag';
import { ITagRepository, TAG_REPOSITORY_TOKEN } from '../../../domain/repositoty-interface';
import { TagRepository } from '../../../driven-adapter/repository';
import { userMock } from '../../mock/user.dto.mock';
describe('CreateTagHandler', () => {
  let handler: CreateTagHandler;
  let domainService: ITagDomainService;
  let repo: ITagRepository;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateTagHandler,
        {
          provide: TAG_DOMAIN_SERVICE_TOKEN,
          useValue: createMock<TagDomainService>(),
        },
        {
            provide: TAG_REPOSITORY_TOKEN,
            useValue: createMock<TagRepository>(),
          },
      ],
    }).compile();

    handler = module.get<CreateTagHandler>(CreateTagHandler);
    domainService = module.get(TAG_DOMAIN_SERVICE_TOKEN);
    repo = module.get(TAG_REPOSITORY_TOKEN);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
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
      jest.spyOn(domainService, 'createTag').mockResolvedValue(tagEntity);
      jest.spyOn(repo, 'findOne').mockResolvedValue(null);

      const command = new CreateTagCommand({
        groupId: tagRecord.groupId,
        name: tagRecord.name,
        userId: tagRecord.createdBy,
      })
      const result = await handler.execute(command)

      expect(repo.findOne).toBeCalledWith({
        name: TagName.fromString(tagRecord.name),
        groupId: GroupId.fromString(tagRecord.groupId),
      });

      expect(domainService.createTag).toBeCalledWith({
        name: TagName.fromString(tagRecord.name),
        groupId: GroupId.fromString(tagRecord.groupId),
        userId: UserId.fromString(tagRecord.createdBy),
      });

      expect(result).toEqual({
        id: tagEntity.get('id').value,
        name: tagEntity.get('name').value,
        groupId: tagEntity.get('groupId').value,
        slug: tagEntity.get('slug').value,
        totalUsed: tagEntity.get('totalUsed').value,
      });
    });

    it('Should throw error when tag name is duplicate', async () => {
      jest.spyOn(repo, 'findOne').mockResolvedValue(tagEntity);

      const command = new CreateTagCommand({
        groupId: tagRecord.groupId,
        name: tagRecord.name,
        userId: tagRecord.createdBy,
      })

      await expect(handler.execute(command)).rejects.toThrow();
    })

    it('Should throw error when tag name is empty', async () => {
      const command = new CreateTagCommand({
        groupId: tagRecord.groupId,
        name: '',
        userId: tagRecord.createdBy,
      })

      await expect(handler.execute(command)).rejects.toThrow();
    })

    it('Should throw error when tag name is too long', async () => {
      const command = new CreateTagCommand({
        groupId: tagRecord.groupId,
        name: 'a'.repeat(256),
        userId: tagRecord.createdBy,
      })

      await expect(handler.execute(command)).rejects.toThrow();
    })

    it('Should throw error when group id is empty', async () => {
      const command = new CreateTagCommand({
        groupId: '',
        name: tagRecord.name,
        userId: tagRecord.createdBy,
      })

      await expect(handler.execute(command)).rejects.toThrow();
    })

    it('Should throw error when group id is invalid', async () => {
      const command = new CreateTagCommand({
        groupId: 'invalid',
        name: tagRecord.name,
        userId: tagRecord.createdBy,
      })

      await expect(handler.execute(command)).rejects.toThrow();
    })

    it('Should throw error when user id is empty', async () => {
      const command = new CreateTagCommand({
        groupId: tagRecord.groupId,
        name: tagRecord.name,
        userId: '',
      })

      await expect(handler.execute(command)).rejects.toThrow();
    })
  });
});
