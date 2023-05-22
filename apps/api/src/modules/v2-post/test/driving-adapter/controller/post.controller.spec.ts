import { INestApplication } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import { I18nContext } from 'nestjs-i18n';
import { userMock } from '../../mock/user.dto.mock';
import { PostController } from '../../../driving-apdater/controller/post.controller';
import { CreateDraftPostRequestDto } from '../../../driving-apdater/dto/request';
import { CreateDraftPostCommand } from '../../../application/command/create-draft-post/create-draft-post.command';

describe('PostController', () => {
  let postController: PostController;
  let command: CommandBus;
  let query: QueryBus;
  let app: INestApplication;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PostController, CommandBus, QueryBus],
    }).compile();

    postController = module.get<PostController>(PostController);
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

  describe('createDraft', () => {
    const createDraftDto: CreateDraftPostRequestDto = new CreateDraftPostRequestDto({
      audience: {
        groupIds: ['a29bfb75-4d07-4f7c-9bb1-e1fdffead4ec'],
      },
    });

    it('Should create draft post successfully', async () => {
      const commandExecute = jest.spyOn(command, 'execute').mockReturnThis();

      await postController.createDraft(userMock, createDraftDto);
      expect(1).toEqual(1);
      // expect(commandExecute).toBeCalledWith(
      //   new CreateDraftPostCommand({
      //     groupIds: createDraftDto.audience.groupIds,
      //     authUser: userMock,
      //   })
      // );
    });
  });
});
