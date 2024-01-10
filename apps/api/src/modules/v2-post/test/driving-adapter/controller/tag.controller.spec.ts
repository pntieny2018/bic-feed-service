import { BadRequestException, INestApplication, NotFoundException } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import { I18nContext } from 'nestjs-i18n';

import { CreateTagCommand, UpdateTagCommand } from '../../../application/command/tag';
import { FindTagsPaginationQuery } from '../../../application/query/tag';
import {
  TagDuplicateNameException,
  TagNotFoundException,
  TagUsedException,
} from '../../../domain/exception';
import { TagController } from '../../../driving-apdater/controller/tag.controller';
import { CreateTagRequestDto, UpdateTagRequestDto } from '../../../driving-apdater/dto/request';
import { createMockUserDto } from '../../mock/user.mock';

const userMock = createMockUserDto();

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
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          t: (...args) => {},
        } as any)
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const tagMock = {
    id: 'f2e60f9d-4e77-42f6-bb63-007e3a18ec67',
    groupId: '452f371c-58c3-45cb-abca-d68c70b82df2',
    name: 'tag bbbdd12 ddffc 1dddf22',
    slug: 'tag-bbbdd12-ddffc-1dddf22',
    totalUsed: 0,
  };

  describe('Get', () => {
    const getTagDto = {
      groupIds: ['452f371c-58c3-45cb-abca-d68c70b82df2'],
      name: 'tag',
      offset: 0,
      limit: 10,
    };

    it('Should get tags successfully', async () => {
      const queryExecute = jest
        .spyOn(query, 'execute')
        .mockResolvedValue({ rows: [tagMock], total: 1 });
      const result = await tagController.getTags(userMock, getTagDto);
      expect(queryExecute).toBeCalledWith(
        new FindTagsPaginationQuery({
          name: getTagDto.name,
          groupIds: getTagDto.groupIds,
          offset: getTagDto.offset,
          limit: getTagDto.limit,
        })
      );
    });
  });

  describe('Create', () => {
    const createTagDto: CreateTagRequestDto = {
      name: 'Tag 1',
      groupId: '452f371c-58c3-45cb-abca-d68c70b82df2',
    };

    it('Should create tag successfully', async () => {
      const commandExecute = jest.spyOn(command, 'execute').mockResolvedValue(tagMock);
      await tagController.createTag(userMock, createTagDto);
      expect(commandExecute).toBeCalledWith(
        new CreateTagCommand({
          groupId: createTagDto.groupId,
          name: createTagDto.name,
          user: userMock,
        })
      );
    });

    it(`Should catch bad request exception`, async () => {
      const err = new TagDuplicateNameException();
      jest.spyOn(command, 'execute').mockRejectedValue(err);
      try {
        await tagController.createTag(userMock, createTagDto);
      } catch (e) {
        expect(e).toEqual(new BadRequestException(err));
      }
    });
  });

  describe('Update', () => {
    const updateTagDto: UpdateTagRequestDto = {
      name: 'Tag 1',
    };

    it('Should update tag successfully', async () => {
      const commandExecute = jest.spyOn(command, 'execute').mockResolvedValue(tagMock);
      const result = await tagController.updateTag(userMock, tagMock.id, updateTagDto);
      expect(commandExecute).toBeCalledWith(
        new UpdateTagCommand({
          id: tagMock.id,
          name: updateTagDto.name,
          actor: userMock,
        })
      );
    });

    it(`Should catch not found exception`, async () => {
      const err = new TagNotFoundException();
      jest.spyOn(command, 'execute').mockRejectedValue(err);
      try {
        await tagController.updateTag(userMock, tagMock.id, updateTagDto);
      } catch (e) {
        expect(e).toEqual(new NotFoundException(err));
      }
    });

    it(`Should catch bad request exception`, async () => {
      const err = new TagDuplicateNameException();
      jest.spyOn(command, 'execute').mockRejectedValue(err);
      try {
        await tagController.updateTag(userMock, tagMock.id, updateTagDto);
      } catch (e) {
        expect(e).toEqual(new BadRequestException(err));
      }
    });

    it('Should catch tag used exception', async () => {
      const err = new TagUsedException();
      jest.spyOn(command, 'execute').mockRejectedValue(err);
      try {
        await tagController.updateTag(userMock, tagMock.id, updateTagDto);
      } catch (e) {
        expect(e).toEqual(new BadRequestException(err));
      }
    });
  });

  describe('Delete', () => {
    const deleteTagDto = {
      id: 'f2e60f9d-4e77-42f6-bb63-007e3a18ec67',
    };

    it('Should delete tag successfully', async () => {
      const commandExecute = jest.spyOn(command, 'execute').mockResolvedValue({});
      await tagController.deleteTag(userMock, deleteTagDto.id);
      expect(commandExecute).toBeCalledTimes(1);
    });

    it(`Should catch not found exception`, async () => {
      const err = new TagNotFoundException();
      jest.spyOn(command, 'execute').mockRejectedValue(err);
      try {
        await tagController.deleteTag(userMock, deleteTagDto.id);
      } catch (e) {
        expect(e).toEqual(new NotFoundException(err));
      }
    });

    it('Should catch tag used exception', async () => {
      const err = new TagUsedException();
      jest.spyOn(command, 'execute').mockRejectedValue(err);
      try {
        await tagController.deleteTag(userMock, deleteTagDto.id);
      } catch (e) {
        expect(e).toEqual(new BadRequestException(err));
      }
    });
  });
});
