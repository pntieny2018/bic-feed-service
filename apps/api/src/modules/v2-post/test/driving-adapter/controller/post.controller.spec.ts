import { CONTENT_STATUS } from '@beincom/constants';
import { createMock } from '@golevelup/ts-jest';
import { BadRequestException, ForbiddenException, INestApplication } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import { plainToClass, plainToInstance } from 'class-transformer';
import { Request } from 'express';
import { I18nContext } from 'nestjs-i18n';

import { TRANSFORMER_VISIBLE_ONLY } from '../../../../../common/constants';
import { DomainModelException } from '../../../../../common/exceptions';
import {
  CreateDraftPostCommand,
  PublishPostCommand,
  UpdatePostCommand,
} from '../../../application/command/post';
import { CreateDraftPostDto, PostDto } from '../../../application/dto';
import { FindPostQuery } from '../../../application/query/post';
import { ContentNoEditSettingPermissionException } from '../../../domain/exception';
import { PostController } from '../../../driving-apdater/controller/post.controller';
import {
  CreateDraftPostRequestDto,
  PublishPostRequestDto,
  UpdatePostRequestDto,
} from '../../../driving-apdater/dto/request';
import { createMockPostDto, createMockUserDto } from '../../mock';

const postMock = createMockPostDto();
const userMock = createMockUserDto();

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
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          t: (...args) => {},
        } as any)
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Create draft post', () => {
    const createPostRequestDto = new CreateDraftPostRequestDto({
      audience: {
        groupIds: ['452f371c-58c3-45cb-abca-d68c70b82df2'],
      },
    });

    it('Should create draft post successfully', async () => {
      const commandExecute = jest.spyOn(command, 'execute').mockResolvedValue(postMock);
      const result = await postController.createDraftPost(userMock, createPostRequestDto);
      expect(commandExecute).toBeCalledWith(
        new CreateDraftPostCommand({
          groupIds: createPostRequestDto.audience.groupIds,
          authUser: userMock,
        })
      );
      expect(
        plainToInstance(PostDto, postMock, { groups: [TRANSFORMER_VISIBLE_ONLY.PUBLIC] })
      ).toEqual(result);
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
      const result = await postController.createDraftPost(userMock, createDraftPostRequestDto);
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
        await postController.createDraftPost(userMock, createDraftPostRequestDto);
      } catch (e) {
        expect(e).toEqual(new ForbiddenException(err));
      }
    });
    it('Should catch BadRequestException', async () => {
      const err = new DomainModelException();
      jest.spyOn(command, 'execute').mockRejectedValue(err);

      try {
        await postController.createDraftPost(userMock, createDraftPostRequestDto);
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
          actor: userMock,
        })
      );
      expect(plainToClass(PostDto, postMock)).toEqual(result);
    });
  });

  describe('updatePost', () => {
    const updatePostRequestDto: UpdatePostRequestDto = {
      content: 'test',
    };
    it('Should update post successfully', async () => {
      const request = createMock<Request>({});
      const commandExecute = jest.spyOn(command, 'execute').mockResolvedValue(postMock);
      const result = await postController.updatePost(
        postMock.id,
        userMock,
        updatePostRequestDto,
        request
      );
      expect(commandExecute).toBeCalledWith(
        new UpdatePostCommand({
          ...updatePostRequestDto,
          mentionUserIds: updatePostRequestDto?.mentions,
          groupIds: updatePostRequestDto?.audience?.groupIds,
          tagIds: updatePostRequestDto?.tags,
          seriesIds: updatePostRequestDto?.series,
          id: postMock.id,
          authUser: userMock,
        })
      );
      expect(
        plainToInstance(PostDto, postMock, { groups: [TRANSFORMER_VISIBLE_ONLY.PUBLIC] })
      ).toEqual(result);
    });

    it('should update post successfully with req.message', async () => {
      const request = createMock<Request>({});
      jest
        .spyOn(command, 'execute')
        .mockResolvedValue({ ...postMock, status: CONTENT_STATUS.PROCESSING });
      const result = await postController.updatePost(
        postMock.id,
        userMock,
        updatePostRequestDto,
        request
      );
      expect(request.message).toEqual('message.post.published_success_with_video_waiting_process');
      expect(
        plainToInstance(
          PostDto,
          { ...postMock, status: CONTENT_STATUS.PROCESSING },
          { groups: [TRANSFORMER_VISIBLE_ONLY.PUBLIC] }
        )
      ).toEqual(result);
    });
  });

  describe('getPostDetail', () => {
    it('Should get post detail successfully', async () => {
      const queryExecute = jest.spyOn(query, 'execute').mockResolvedValue(postMock);
      const result = await postController.getPostDetail(postMock.id, userMock);
      expect(queryExecute).toBeCalledWith(
        new FindPostQuery({ postId: postMock.id, authUser: userMock })
      );
      expect(
        plainToClass(PostDto, postMock, { groups: [TRANSFORMER_VISIBLE_ONLY.PUBLIC] })
      ).toEqual(result);
    });
  });
});
