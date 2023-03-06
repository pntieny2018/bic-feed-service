import { ReactionController } from '../../../driving-apdater/controller/reaction.controller';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { I18nContext } from 'nestjs-i18n';
import { REACTION_TARGET } from '../../../data-type';

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
    id: 'f2e60f9d-4e77-42f6-bb63-007e3a18ec67',
    reactionName: 'like',
    actor: {
      id: 'f2e60f9d-4e77-42f6-bb63-007e3a18ec67',
    },
    createdAt: new Date(),
  };

  describe('Get', () => {
    const getReactionDto = {
      reactionName: 'like',
      target: REACTION_TARGET.POST,
      targetId: 'f2e60f9d-4e77-42f6-bb63-007e3a18ec67',
    };

    it('Should get reactions successfully', async () => {
      jest.spyOn(query, 'execute').mockResolvedValue({ rows: [reactionMock], total: 1 });
      const result = await reactionController.get(getReactionDto);
      expect(result).toEqual({
        list: [reactionMock],
        total: 1,
      });
    });
  });
});
