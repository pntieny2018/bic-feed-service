import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { v4 } from 'uuid';
import { StringHelper } from '../../../../../common/helpers';
import { UserId } from '../../../../v2-user/domain/model/user';
import { TagDomainService } from '../../../domain/domain-service';
import {
  ITagDomainService,
  TAG_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface';
import { TagEntity } from '../../../domain/model/tag';
import { ITagRepository, TAG_REPOSITORY_TOKEN } from '../../../domain/repositoty-interface';
import { TagRepository } from '../../../driven-adapter/repository';
import { userMock } from '../../mock/user.dto.mock';
import { UpdateTagHandler } from '../../../application/command/update-tag/update-tag.handler';
import { UpdateTagCommand } from '../../../application/command/update-tag/update-tag.command';
import { I18nContext } from 'nestjs-i18n';
import { TagDuplicateNameException, TagNotFoundException } from '../../../exception';

describe('UpdateTagHandler', () => {
  let handler: UpdateTagHandler;
  let domainService: ITagDomainService;
  let repo: ITagRepository;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateTagHandler,
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

    handler = module.get<UpdateTagHandler>(UpdateTagHandler);
    domainService = module.get(TAG_DOMAIN_SERVICE_TOKEN);
    repo = module.get(TAG_REPOSITORY_TOKEN);
    jest.spyOn(I18nContext, 'current').mockImplementation(
      () =>
        ({
          t: (...args) => {},
        } as any)
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should update tag name success', async () => {
      const id = v4();
      const name = StringHelper.randomStr(10);
      const tag = new TagEntity({
        id: id,
        groupId: v4(),
        name: name,
        slug: StringHelper.convertToSlug(name),
        totalUsed: 0,
        updatedBy: userMock.id,
        createdBy: userMock.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const newName = 'new name ' + name;
      const command = new UpdateTagCommand({ id, name: newName, userId: userMock.id });
      jest.spyOn(repo, 'findOne').mockResolvedValue(tag);
      await handler.execute(command);
      expect(domainService.updateTag).toBeCalledWith(tag, {
        id,
        name: newName,
        userId: userMock.id,
      });
    });

    it('should throw error when tag not found', async () => {
      const id = v4();
      const name = StringHelper.randomStr(10);
      const newName = 'new name ' + name;
      const command = new UpdateTagCommand({ id, name: newName, userId: userMock.id });
      jest.spyOn(repo, 'findOne').mockResolvedValue(null);
      await expect(handler.execute(command)).rejects.toThrowError(TagNotFoundException);
    });

    it('should throw error when tag name is empty', async () => {
      const id = v4();
      const name = StringHelper.randomStr(10);
      const tag = new TagEntity({
        id: id,
        groupId: v4(),
        name: name,
        slug: StringHelper.convertToSlug(name),
        totalUsed: 0,
        updatedBy: userMock.id,
        createdBy: userMock.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const command = new UpdateTagCommand({ id: v4(), name: name, userId: userMock.id });
      jest.spyOn(repo, 'findOne').mockResolvedValue(tag);
      await expect(handler.execute(command)).rejects.toThrowError(TagDuplicateNameException);
    });
  });
});
