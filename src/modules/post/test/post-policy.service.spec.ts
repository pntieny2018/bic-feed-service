import { createMock } from '@golevelup/ts-jest';
import { getModelToken } from '@nestjs/sequelize';
import { Test, TestingModule } from '@nestjs/testing';
import { Sequelize } from 'sequelize-typescript';
import { PostAllow } from '..';
import { PostModel } from '../../../database/models/post.model';
import { PostPolicyService } from '../post-policy.service';
import { mockedPostData } from './mocks/response/post.response.mock';

describe('PostPolicyService', () => {
  let postService: PostPolicyService;
  let sequelize: Sequelize;
  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        PostPolicyService,
        {
          provide: Sequelize,
          useValue: {
            transaction: jest.fn(),
          },
        },
        {
          provide: getModelToken(PostModel),
          useValue: {
            create: jest.fn(),
            update: jest.fn(),
            findOne: jest.fn(),
            addMedia: jest.fn(),
            destroy: jest.fn()
          },
        },
      ],
    }).compile();

    postService = moduleRef.get<PostPolicyService>(PostPolicyService);
    sequelize = moduleRef.get<Sequelize>(Sequelize);
  });
  afterEach(async () => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });
  it('should be defined', () => {
    expect(postService).toBeDefined();
  });

  describe('allow', () => {
    it('Throw exception', async () => {
      let post = createMock<PostModel>(mockedPostData);
      post.canReact = false;
      try {
        await postService.allow(post, PostAllow.REACT);
      }
      catch(e) {
        // expect(e).toBeInstanceOf(LogicException)
      }

    });
  });
});
