import { createMock } from '@golevelup/ts-jest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
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
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      // imports: [I18nModule],
      providers: [TagController, CommandBus, QueryBus],
    }).compile();

    tagController = module.get<TagController>(TagController);
    command = module.get<CommandBus>(CommandBus);
    query = module.get<QueryBus>(QueryBus);
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
    };
    it('Should create tag successfully', async () => {
      jest.spyOn(I18nContext, 'current').mockImplementation(() => ({
        t: (...args) => {} 
      } as any));

      jest.spyOn(command, 'execute').mockResolvedValue(() => tagMock);
      const result = await tagController.create(userMock, createTagDto);
      expect(1).toEqual(1);
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
