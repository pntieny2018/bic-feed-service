import { PostService } from '../post.service';
import { Test, TestingModule } from '@nestjs/testing';
import { InternalPostController } from '../post-consummer.controller';
import { PostPrivacy } from '../../../database/models/post.model';
jest.mock('../post.service')
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
      postService.bulkUpdatePostPrivacy = jest.fn().mockResolvedValue([1,2])

      postService.filterPostIdsNeedToUpdatePrivacy = jest.fn().mockResolvedValue({[PostPrivacy.PRIVATE.toString()]: ['8c846fe3-a615-42ae-958a-33a43d24a033']})
      await internalPostController.privacyUpdate({privacy: PostPrivacy.SECRET, groupId: '8c846fe3-a615-42ae-958a-33a43d24a033'})
      expect(logSpy).toBeCalled()
    })
  })
})
