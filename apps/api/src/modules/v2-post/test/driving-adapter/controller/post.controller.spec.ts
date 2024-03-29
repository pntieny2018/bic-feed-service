import {
  BadRequestException,
  ForbiddenException,
  INestApplication,
  NotFoundException,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import { I18nContext } from 'nestjs-i18n';
import { userMock } from '../../mock/user.dto.mock';
import { PostController } from '../../../driving-apdater/controller/post.controller';
import {
  CreateDraftPostRequestDto,
  PublishPostRequestDto,
} from '../../../driving-apdater/dto/request';
import { CreateDraftPostCommand } from '../../../application/command/create-draft-post/create-draft-post.command';
import { plainToClass } from 'class-transformer';
import { Request } from 'express';
import { createMock } from '@golevelup/ts-jest';
import { PublishPostCommand } from '../../../application/command/publish-post/publish-post.command';
import { PostDto } from '../../../application/dto';
import { postMock } from '../../mock/post.dto.mock';
import {
  ContentNoEditSettingPermissionException,
  ContentNotFoundException,
} from '../../../domain/exception';
import { DomainModelException } from '../../../../../common/exceptions/domain-model.exception';
import { CreateDraftPostDto } from '../../../application/command/create-draft-post/create-draft-post.dto';

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

  describe.skip('Create', () => {
    const createPostRequestDto = new CreateDraftPostRequestDto({
      audience: {
        groupIds: ['452f371c-58c3-45cb-abca-d68c70b82df2'],
      },
    });

    it('Should create post successfully', async () => {
      const commandExecute = jest.spyOn(command, 'execute').mockReturnThis();
      await postController.createDraft(userMock, createPostRequestDto);
      expect(1).toEqual(1);
    });
  });

  describe('createDraft', () => {
    const createDraftPostRequestDto = new CreateDraftPostRequestDto({
      audience: {
        groupIds: ['452f371c-58c3-45cb-abca-d68c70b82df2'],
      },
    });

    it('Should create draft post successfully', async () => {
      const commandExecute = jest.spyOn(command, 'execute').mockResolvedValue(postMock);
      const result = await postController.createDraft(userMock, createDraftPostRequestDto);
      expect(commandExecute).toBeCalledWith(
        new CreateDraftPostCommand({
          groupIds: createDraftPostRequestDto.audience.groupIds,
          authUser: userMock,
        })
      );
      expect(plainToClass(CreateDraftPostDto, postMock)).toEqual(result);
    });
    it('Should catch ForbiddenException', async () => {
      const err = new ContentNoEditSettingPermissionException();
      jest.spyOn(command, 'execute').mockRejectedValue(err);

      try {
        await postController.createDraft(userMock, createDraftPostRequestDto);
      } catch (e) {
        expect(e).toEqual(new ForbiddenException(err));
      }
    });
    it('Should catch BadRequestException', async () => {
      const err = new DomainModelException();
      jest.spyOn(command, 'execute').mockRejectedValue(err);

      try {
        await postController.createDraft(userMock, createDraftPostRequestDto);
      } catch (e) {
        expect(e).toEqual(new BadRequestException(err));
      }
    });
  });

  describe('publishPost', () => {
    const publishPostRequestDto = new PublishPostRequestDto({
      audience: {
        groupIds: ['452f371c-58c3-45cb-abca-d68c70b82df2'],
      },
      content: 'demo',
      tags: ['452f371c-58c3-45cb-abca-d68c70b82df2'],
    });

    it('Should publish post successfully', async () => {
      const commandExecute = jest.spyOn(command, 'execute').mockResolvedValue(postMock);
      const request = createMock<Request>({});
      const result = await postController.publishPost(
        postMock.id,
        userMock,
        publishPostRequestDto,
        request
      );
      expect(commandExecute).toBeCalledWith(
        new PublishPostCommand({
          ...publishPostRequestDto,
          id: postMock.id,
          mentionUserIds: undefined,
          groupIds: publishPostRequestDto.audience?.groupIds,
          tagIds: ['452f371c-58c3-45cb-abca-d68c70b82df2'],
          seriesIds: undefined,
          media: undefined,
          authUser: userMock,
        })
      );
      expect(plainToClass(PostDto, postMock)).toEqual(result);
    });

    it('Should catch NotFoundException', async () => {
      const err = new ContentNotFoundException();
      jest.spyOn(command, 'execute').mockRejectedValue(err);
      const request = createMock<Request>({});

      try {
        await postController.publishPost(postMock.id, userMock, publishPostRequestDto, request);
      } catch (e) {
        expect(e).toEqual(new NotFoundException(err));
      }
    });

    it('Should catch ForbiddenException', async () => {
      const err = new ContentNoEditSettingPermissionException();
      jest.spyOn(command, 'execute').mockRejectedValue(err);
      const request = createMock<Request>({});

      try {
        await postController.publishPost(postMock.id, userMock, publishPostRequestDto, request);
      } catch (e) {
        expect(e).toEqual(new ForbiddenException(err));
      }
    });
    it('Should catch BadRequestException', async () => {
      const err = new DomainModelException();
      jest.spyOn(command, 'execute').mockRejectedValue(err);
      const request = createMock<Request>({});

      try {
        await postController.publishPost(postMock.id, userMock, publishPostRequestDto, request);
      } catch (e) {
        expect(e).toEqual(new BadRequestException(err));
      }
    });
  });
});
