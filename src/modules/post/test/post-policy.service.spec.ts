import { Test, TestingModule } from '@nestjs/testing';
import { PostPolicyService } from '../post-policy.service';
import { IPost, PostModel } from '../../../database/models/post.model';
import { PostAllow } from '..';
import { Sequelize } from 'sequelize-typescript';
import { getModelToken } from '@nestjs/sequelize';
import { LogicException } from '../../../common/exceptions';
import { mockedPostData } from './mocks/response/post.response.mock';
import { createMock } from '@golevelup/ts-jest';

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
        expect(e).toBeInstanceOf(LogicException)
      }
      
    });
  });
});
