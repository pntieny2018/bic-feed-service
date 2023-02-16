import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { v4 } from 'uuid';
import { StringHelper } from '../../../../../common/helpers';
import { TagDomainService } from '../../../domain/domain-service';
import { ITagDomainService, TAG_DOMAIN_SERVICE_TOKEN } from '../../../domain/domain-service/interface';
import { TagEntity } from '../../../domain/model/tag';
import { ITagRepository, TAG_REPOSITORY_TOKEN } from '../../../domain/repositoty-interface';
import { TagRepository } from '../../../driven-adapter/repository';
import { userMock } from '../../mock/user.dto.mock';
import { DeleteTagHandler } from '../../../application/command/delete-tag/delete-tag.handler';
import { DeleteTagCommand } from '../../../application/command/delete-tag/delete-tag.command';

describe('DeleteTagHandler', () => {
  let handler: DeleteTagHandler;
  let domainService: ITagDomainService;
  let repo: ITagRepository;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteTagHandler,
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

    handler = module.get<DeleteTagHandler>(DeleteTagHandler);
    domainService = module.get(TAG_DOMAIN_SERVICE_TOKEN);
    repo = module.get(TAG_REPOSITORY_TOKEN);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should delete tag success', async () => {
      const id = v4();
      const name = StringHelper.randomStr(10);
      const tag = TagEntity.fromJson(
        {
          id: id,
          groupId: v4(),
          name: name,
          slug: StringHelper.convertToSlug(name),
          totalUsed: 0,
          updatedBy: userMock.id,
          createdBy: userMock.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      );
      const command = new DeleteTagCommand({ id, userId: userMock.id });
      jest.spyOn(repo, 'findOne').mockResolvedValue(tag);
      await handler.execute(command);
      expect(domainService.deleteTag).toBeCalledWith(tag.id);
    });

    it('should throw error when tag not found', async () => {
      const id = v4();
      const command = new DeleteTagCommand({ id, userId: userMock.id });
      jest.spyOn(repo, 'findOne').mockResolvedValue(null);
      await expect(handler.execute(command)).rejects.toThrowError();
    })

    it('should throw error when tag is used', async () => {
      const id = v4();
      const name = StringHelper.randomStr(10);
      const tag = TagEntity.fromJson(
        {
          id: id,
          groupId: v4(),
          name: name,
          slug: StringHelper.convertToSlug(name),
          totalUsed: 1,
          updatedBy: userMock.id,
          createdBy: userMock.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      );
      const command = new DeleteTagCommand({ id: id, userId: userMock.id });
      jest.spyOn(repo, 'findOne').mockResolvedValue(tag);
      await expect(handler.execute(command)).rejects.toThrowError();
    })
  });
});
