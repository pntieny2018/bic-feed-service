import { INestApplication } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import { I18nContext } from 'nestjs-i18n';

import { OrderEnum } from '../../../../../common/dto';
import { REACTION_TARGET } from '../../../data-type/reaction.enum';
import { ReactionController } from '../../../driving-apdater/controller/reaction.controller';
import { createMockUserDto } from '../../mock/user.mock';

const userMock = createMockUserDto();

describe('ReactionController', () => {
  let reactionController: ReactionController;
  let command: CommandBus;
  let query: QueryBus;
  let app: INestApplication;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReactionController, CommandBus, QueryBus],
    }).compile();

    reactionController = module.get<ReactionController>(ReactionController);
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

  const reactionMock = {
    id: 'c2e60f9d-4e77-42f6-bb63-007e3a18ec67',
    reactionName: 'like',
    actor: {
      id: 'e2e60f9d-4e77-42f6-bb63-007e3a18ec67',
    },
    createdAt: new Date(),
  };

  describe('Get', () => {
    const getReactionDto = {
      reactionName: 'like',
      target: REACTION_TARGET.POST,
      targetId: 'f2e60f9d-4e77-42f6-bb63-007e3a18ec67',
      limit: 25,
      latestId: null,
      order: OrderEnum.DESC,
    };

    it('Should get reactions successfully', async () => {
      jest.spyOn(query, 'execute').mockResolvedValue({ rows: [reactionMock], total: 1 });
      const result = await reactionController.get(userMock, getReactionDto);
      expect(result).toEqual({
        latestId: reactionMock.id,
        limit: 25,
        list: [
          {
            actor: reactionMock.actor,
            createdAt: reactionMock.createdAt,
            id: reactionMock.id,
            reactionName: reactionMock.reactionName,
          },
        ],
        order: getReactionDto.order,
      });
    });
  });

  describe('Create', () => {
    const createReactionDto = {
      target: REACTION_TARGET.POST,
      targetId: 'f2e60f9d-4e77-42f6-bb63-007e3a18ec67',
      reactionName: 'like',
    };

    it('Should create reaction successfully', async () => {
      jest.spyOn(command, 'execute').mockResolvedValue(reactionMock);
      const result = await reactionController.create(userMock, createReactionDto);
      expect(result).toEqual({
        actor: reactionMock.actor,
        createdAt: reactionMock.createdAt,
        id: reactionMock.id,
        reactionName: reactionMock.reactionName,
      });
    });

    it('Should throw error when create reaction failed', async () => {
      jest.spyOn(command, 'execute').mockRejectedValue(new Error('error'));
      await expect(reactionController.create(userMock, createReactionDto)).rejects.toThrowError(
        'error'
      );
    });
  });

  describe('Delete', () => {
    const deleteReactionDto = {
      target: REACTION_TARGET.POST,
      targetId: 'f2e60f9d-4e77-42f6-bb63-007e3a18ec67',
      reactionName: 'like',
    };

    it('Should delete reaction successfully', async () => {
      jest.spyOn(command, 'execute').mockResolvedValue(true);
      const result = await reactionController.delete(userMock, deleteReactionDto);
      expect(result).toEqual(undefined);
    });

    it('Should throw error when delete reaction failed', async () => {
      jest.spyOn(command, 'execute').mockRejectedValue(new Error('error'));
      await expect(reactionController.delete(userMock, deleteReactionDto)).rejects.toThrowError(
        'error'
      );
    });
  });
});
