import { BadRequestException, INestApplication, NotFoundException } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import { I18nContext } from 'nestjs-i18n';
import { TagController } from '../../../driving-apdater/controller/tag.controller';
import { TagDuplicateNameException, TagNotFoundException } from '../../../exception';
import { userMock } from '../../mock/user.dto.mock';
describe('TagController', () => {
  let tagController: TagController;
  let command: CommandBus;
  let query: QueryBus;
  let app: INestApplication;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TagController, CommandBus, QueryBus],
    }).compile();

    tagController = module.get<TagController>(TagController);
    command = module.get<CommandBus>(CommandBus);
    query = module.get<QueryBus>(QueryBus);

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

  describe('Create', () => {
    const createTagDto = {
      name: 'Tag 1',
      groupId: '452f371c-58c3-45cb-abca-d68c70b82df2',
    };

    const tagMock = {
      id: 'f2e60f9d-4e77-42f6-bb63-007e3a18ec67',
      groupId: '452f371c-58c3-45cb-abca-d68c70b82df2',
      name: 'tag bbbdd12 ddffc 1dddf22',
      slug: 'tag-bbbdd12-ddffc-1dddf22',
      totalUsed: 0,
      createdBy: userMock.id,
      updatedBy: userMock.id,
    };
    it('Should create tag successfully', async () => {
      jest.spyOn(command, 'execute').mockResolvedValue(tagMock);
      const result = await tagController.create(userMock, createTagDto);
      expect(result).toEqual({
        id: tagMock.id,
        groupId: tagMock.groupId,
        name: tagMock.name,
        slug: tagMock.slug,
        totalUsed: tagMock.totalUsed,
        createdAt: undefined,
        updatedAt: undefined,
        groups: undefined,
      });
    });

    it(`Should catch not found exception`, async () => {
      const err = new TagNotFoundException();
      jest.spyOn(command, 'execute').mockRejectedValue(err);
      try {
        await tagController.create(userMock, createTagDto);
      } catch (e) {
        expect(e).toEqual(new NotFoundException(err));
      }
    });

    it(`Should catch bad request exception`, async () => {
      const err = new TagDuplicateNameException();
      jest.spyOn(command, 'execute').mockRejectedValue(err);
      try {
        await tagController.create(userMock, createTagDto);
      } catch (e) {
        expect(e).toEqual(new BadRequestException(err));
      }
    });
  });
});
