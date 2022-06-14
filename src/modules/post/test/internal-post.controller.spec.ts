import { PostService } from '../post.service';
import { Test, TestingModule } from '@nestjs/testing';
import { InternalPostController } from '../internal-post.controller';
import { PostPrivacy } from '../../../database/models/post.model';
import { PostController } from '../post.controller';
import { RedisModule } from '@app/redis';
import { ClientsModule } from '@nestjs/microservices';

describe('InternalPostController', () => {
  let postService: PostService;
  let internalPostController: InternalPostController;


  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [InternalPostController],
      providers: [
        {
          provide: PostService,
          useClass: jest.fn(),
        },
      ],
    }).compile();
    internalPostController = moduleRef.get<InternalPostController>(InternalPostController);
    postService = moduleRef.get<PostService>(PostService);
  });

  afterEach(async () => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  describe('privacyUpdate', () => {
    it('should done', async () => {
      const logSpy = jest.spyOn(internalPostController['_logger'], 'debug').mockReturnThis();
      postService.findPostIdsByGroupId = jest.fn().mockResolvedValue([1,2])
      postService.filterPostIdsNeedToUpdatePrivacy = jest.fn().mockResolvedValue({[PostPrivacy.PRIVATE.toString()]: ['1']})
      await internalPostController.privacyUpdate({privacy: PostPrivacy.SECRET, groupId: 1})
      expect(logSpy).toBeCalled()
    })
  })
})
