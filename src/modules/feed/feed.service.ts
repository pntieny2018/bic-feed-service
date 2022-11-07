import { BadRequestException, forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Transaction } from 'sequelize';
import { SentryService } from '@app/sentry';
import { PageDto, PageMetaDto } from '../../common/dto';
import { IPost, PostModel } from '../../database/models/post.model';
import { UserNewsFeedModel } from '../../database/models/user-newsfeed.model';
import { UserSeenPostModel } from '../../database/models/user-seen-post.model';
import { GroupService } from '../../shared/group';
import { UserDto } from '../auth';
import { PostResponseDto } from '../post/dto/responses';
import { PostService } from '../post/post.service';
import { GetTimelineDto } from './dto/request';
import { GetNewsFeedDto } from './dto/request/get-newsfeed.dto';
import { UserDataShareDto } from '../../shared/user/dto';
import { ExceptionHelper } from '../../common/helpers';
import { HTTP_STATUS_ID } from '../../common/constants';
import { GetUserSeenPostDto } from './dto/request/get-user-seen-post.dto';
import { UserService } from '../../shared/user';
import { GroupPrivacy } from '../../shared/group/dto';
import { PostBindingService } from '../post/post-binding.service';
import { ClassTransformer } from 'class-transformer';
import { ArticleResponseDto } from '../article/dto/responses';

@Injectable()
export class FeedService {
  private readonly _logger = new Logger(FeedService.name);
  private readonly _classTransformer = new ClassTransformer();
  public constructor(
    private readonly _userService: UserService,
    private readonly _groupService: GroupService,
    @Inject(forwardRef(() => PostService))
    private readonly _postService: PostService,
    @InjectModel(UserNewsFeedModel)
    private _newsFeedModel: typeof UserNewsFeedModel,
    @InjectModel(UserSeenPostModel)
    private _userSeenPostModel: typeof UserSeenPostModel,
    private _sentryService: SentryService,
    private _postBindingService: PostBindingService
  ) {}

  /**
   * Get NewsFeed
   */
  public async getNewsFeed(authUser: UserDto, getNewsFeedDto: GetNewsFeedDto): Promise<any> {
    const { isImportant, limit, offset } = getNewsFeedDto;
    const postIdsAndSorted = await this._postService.getPostIdsInNewsFeed(authUser.id, {
      limit: limit + 1, //1 is next row
      offset,
      isImportant,
    });
    let hasNextPage = false;
    if (postIdsAndSorted.length > limit) {
      postIdsAndSorted.pop();
      hasNextPage = true;
    }
    const posts = await this._postService.getPostsByIds(postIdsAndSorted, authUser.id);

    const postsBindedData = await this._bindAndTransformData({
      posts: posts,
      authUser,
    });

    return new PageDto<PostResponseDto>(postsBindedData, {
      limit,
      offset,
      hasNextPage,
    });
  }

  private async _bindAndTransformData({
    posts,
    authUser,
  }: {
    posts: IPost[];
    authUser: UserDto;
  }): Promise<ArticleResponseDto[]> {
    const postsBindedData = await this._postBindingService.bindRelatedData(posts, {
      shouldBindReaction: true,
      shouldBindActor: true,
      shouldBindMention: true,
      shouldBindAudience: true,
      shouldHideSecretAudienceCanNotAccess: true,
      authUser,
    });

    return this._classTransformer.plainToInstance(ArticleResponseDto, postsBindedData, {
      excludeExtraneousValues: true,
    });
  }

  public async getUsersSeenPots(
    user: UserDto,
    getUserSeenPostDto: GetUserSeenPostDto
  ): Promise<PageDto<UserDataShareDto>> {
    try {
      const { postId } = getUserSeenPostDto;

      const post = await this._postService.findPost({
        postId: postId,
      });
      const groupsOfUser = user.profile.groups;
      const groupIds = post.groups.map((g) => g.groupId);
      const groupInfos = await this._groupService.getMany(groupIds);

      const privacy = groupInfos.map((g) => g.privacy);

      if (privacy.every((p) => p !== GroupPrivacy.OPEN && p !== GroupPrivacy.PUBLIC)) {
        if (!this._groupService.isMemberOfSomeGroups(groupIds, groupsOfUser)) {
          ExceptionHelper.throwLogicException(HTTP_STATUS_ID.API_FORBIDDEN);
        }
      }

      const usersSeenPost = await this._userSeenPostModel.findAll({
        where: {
          postId: postId,
        },
        order: [['createdAt', 'DESC']],
        limit: getUserSeenPostDto?.limit || 20,
        offset: getUserSeenPostDto?.offset || 0,
      });

      const total = await this._userSeenPostModel.count({
        where: {
          postId: postId,
        },
      });

      const users = await this._userService.getMany(usersSeenPost.map((usp) => usp.userId));

      return new PageDto<UserDataShareDto>(
        users,
        new PageMetaDto({
          total: total ?? 0,
          pageOptionsDto: {
            limit: getUserSeenPostDto?.limit || 20,
            offset: getUserSeenPostDto?.offset || 0,
          },
        })
      );
    } catch (ex) {
      this._logger.error(ex, ex.stack);
      this._sentryService.captureException(ex);
      throw ex;
    }
  }

  public async markSeenPosts(postId: string, userId: string): Promise<void> {
    try {
      const exist = await this._userSeenPostModel.findOne({
        where: {
          postId: postId,
          userId: userId,
        },
      });
      if (!exist) {
        await this._userSeenPostModel.create(
          {
            postId: postId,
            userId: userId,
          },
          { ignoreDuplicates: true }
        );

        await this._newsFeedModel.update(
          { isSeenPost: true },
          {
            where: { userId, postId },
          }
        );
      }
    } catch (ex) {
      this._logger.error(ex, ex.stack);
      this._sentryService.captureException(ex);
    }
  }

  /**
   * Get Timeline
   */
  public async getTimeline(authUser: UserDto, getTimelineDto: GetTimelineDto): Promise<any> {
    const { limit, offset, groupId } = getTimelineDto;
    let group = await this._groupService.get(groupId);
    if (!group) {
      throw new BadRequestException(`Group ${groupId} not found`);
    }
    group = {
      child: {
        open: [
          '7bb03a34-d4f1-4b30-bfa2-43ec200a32ca',
          'b23cf63f-7cfc-4a49-8e96-9c769c02d8fe',
          '90960666-1071-4cea-90b9-870edfd0d253',
          '8a568caa-f26f-4525-b71e-923ef3129035',
          '92301557-c965-4c57-9928-7fdd8bebe621',
          '11732916-01c5-482b-b486-37cd606957a8',
          '06dc1434-55eb-43ba-b0c8-13b2a339bf5a',
          '1cb4c695-bf1a-4f54-b0c5-eafa4828302d',
          'd1445734-ecda-4a6f-a0db-e9571645c40b',
          '70e4fc49-a21f-4188-b5b9-85a6ba8671ae',
        ],
        public: [],
        secret: [
          '32b1225e-423c-4ea2-8fac-a6a14aa92772',
          'f65e4645-db7f-437c-8eda-9222d770aa8c',
          '09c926b3-3d84-4768-8db6-2c075ab6cdda',
          '8f10a692-6447-41c3-bc39-79667c8456d6',
          'ff52671b-a6f4-4652-8ecd-8ffd15da464c',
          'fd39ad3a-faa3-4ce0-95f7-df3295cc66c1',
          'c42fd7cc-7136-4d7e-b80c-9fc6b4a1c52a',
          '3934676f-63f6-470a-8639-6a738c287215',
          '9f51f7bc-8d7f-4e18-8d15-b74d4e48513f',
        ],
        private: [
          'e2ee7740-33f7-434b-bea4-23a454f15cc2',
          '73872d85-9740-414f-bace-4e872da9072a',
          'cae014a4-e7f0-49ed-ab9a-4c7fc840febc',
          '5cae4145-ed09-4446-be2d-0afa9b354a36',
          '7a5fb629-a4ba-486c-a7d8-a14429842256',
          '4c8e1a73-ccc7-4c99-91ff-82f177f24974',
          '523d3685-8481-4035-a935-c54413db6f0d',
          '49be6a3e-fc39-41ce-bb83-1fac579ee8c2',
          '72a1d224-3d55-4651-9774-7d01ae3e94cc',
          '7acc94f5-3188-4417-9a88-5a5d50365807',
          'bbaaea7f-c0d4-45a2-83ae-a82d0d0b06bf',
          '388bc022-c501-4656-b524-43a4b4bba021',
          '9e11eca6-60fa-430d-9220-4a80411d848a',
          '96a31a09-4bba-4949-8a63-cc37aca88b8e',
          'b4853d0f-d111-47f2-a25d-323b2e3bf8b9',
          '05d4e65c-e197-42c1-adf9-d1917bd54630',
          '1e3686c6-f7ac-4025-a39a-0d091f13e7c5',
          '3bd76dee-05d5-4e85-93df-57df635cf70a',
          '46f65000-6d38-4a3b-b611-4affd786ad42',
          'd529a2a6-9c2e-41c2-90ae-69d83fca6579',
          'bb8d2e56-dd3f-452d-b81a-93930f00bcd8',
          '02bf4ff3-f212-4fe9-b973-fcb2413d0db4',
          '59779f78-ff9b-4672-a173-155a4cf442a7',
          'b78df242-61f9-4353-bf3b-99667d1bbdaf',
          '411f50fb-7ccb-49db-af72-33acd83dc041',
          '5413fab0-6b6b-48e7-81b6-07ac9b4086fa',
          'd60113ed-7bb3-475a-924c-fb0d9db88154',
          '61a9fcae-7344-4e6f-9adf-369320110346',
          '0c59b648-95b5-4ce9-bad0-c33cd7e4534d',
          '4b5cf8f7-cfde-42cd-a83e-2cc65281c149',
          'ceb197ab-177a-46c0-a676-98758dd8cd62',
          'a04ba01f-abf1-4f4d-a720-bf3032bea859',
          'fa9b660b-013f-41e4-80eb-edbbc529f10d',
          '5a67e864-fb82-4d8b-9b82-7272e7a0b95e',
          'eb182e99-8c9a-4df9-bb1f-cc0ec5570d88',
          '6cb74561-7d9a-448c-ae74-1d268b666616',
          'c03852fc-0cac-4c19-b94f-1fa928a325b1',
          'f43322c3-90d4-459c-a755-1a33845f2781',
          'a74048ed-a533-4fbe-bea6-cdd79266536a',
          'fd576b39-fe96-4dc8-b92f-4aa06b0dc14a',
          '131ec037-dea3-48f8-8fcc-60bf054f9402',
          'ce9e9cc9-eeed-494b-a74a-972072d70a32',
          '65e213c6-7432-4fe0-a6c6-592e7290c69b',
          '37ab75e8-9a64-4b4d-bcfd-e1699f787f19',
          '7dbc5837-af9a-44a1-9a2f-d799577cafd9',
          '9c609b46-0f22-48bc-b5f4-e7f07e715ee8',
          '5c9067a8-b427-4c87-817d-11ae2eb8655f',
          'aedc348f-4e28-41e8-8d69-4add54561e31',
          'c7b49b1e-4ef2-426f-abec-1aafb1e602ac',
          '432a97b1-ea35-4461-9ad3-c8f7b2debc22',
          '75f6f50d-3764-44f6-ba69-2f592d52e36e',
          'e28d5950-b8ba-401d-9299-d75c3ff12402',
          '14b50a4f-05fa-49df-9784-e55fcbee36e8',
          '3949f3a4-a161-4dc3-946a-a93616429cf1',
          'd6ce9429-ad8e-4fe4-a076-194f0e099438',
          '17dcdaa3-ecbc-4699-a63b-3b687bfb80ae',
          'ea80c710-64f7-4f4b-8384-fc6739ac144b',
          '985cae3b-12a7-4715-a109-322cff0652d6',
          'd42ad679-d657-412b-8e31-5740afd7983f',
          'd28d8600-905e-48ea-9239-11511d40a9e3',
          'e3e67c76-ab8e-4358-b8e9-49e8bc67f7c4',
          '9c2726cd-5544-4668-8465-7d39b36e1460',
          '57b6d606-ef01-41b6-8247-43ebd2162203',
          'b57ac4a4-4fe5-4e1e-b1e0-6d6dff43497b',
          'd22394d1-aaeb-4d7a-9bc9-25caad4c1a1d',
          '118d8f02-0b52-4807-8c01-c5d5b6d0efd3',
          '799f4479-008f-49b6-bccc-9904ec4236c7',
          '45a57adc-299d-4af1-bc7c-36df1f0da2be',
          'bedbbeb8-abe3-4672-a7ba-1bc6f34e0de7',
          'fb688cd9-8acf-47a2-a584-20633bace927',
          '9ce6cfab-bdf7-481b-b5ff-e8a7fe1c1daa',
          '3227628d-e987-4053-ae50-2d78ff87ff08',
          '1a9c4f10-d147-4238-be31-c7df2bc27831',
          '3d289766-a514-45b9-9468-def5dba97aab',
          '34fb9738-3516-48e0-846a-7ed94f166f83',
          '0f0d3927-1283-4d24-b35d-95abfa978e3a',
          '776f3ccc-7555-4dc1-b673-f612cdcb43e9',
          'e6645035-c4a5-42e8-9d98-db458e07aa5a',
          '6dde7ec8-dd6c-4559-a0c0-e23ae6f9f1eb',
          '0a2abf66-5f00-486d-b015-b840460f3752',
          'bc036bf7-91e1-4be9-a953-8e4538b77be5',
          '3ad957c7-8ee1-47c6-b347-f547c80cb7b3',
          'f219eb41-297a-40b2-a5ab-b3fb6fa4bf26',
          '09322535-8bcb-4648-b8b7-1454595caaf8',
          'cd147a31-34a1-49d1-a2ed-e1a5fade6f25',
          '657bf2f2-0754-4018-804b-4cc178f3811f',
          'f0882f02-0179-40c5-8610-7de4b53c5aa1',
          '39ca3d7b-fd01-49d1-b377-d2f018d0d236',
          '05c308a7-35af-4721-825e-be566a7364d6',
          'c4417b73-a2de-4084-94f9-d6aa0d52f2b0',
          'eabe8a64-d640-485a-a2bb-07313a263ca4',
          '03c148eb-097e-42bd-816d-84a17c1ee9de',
          'c38ac741-3b95-4345-80b7-c997f89f538f',
          '1810b892-4878-473d-9c06-2f5e54e90feb',
          '9dd5fb9f-f8d0-4765-a50a-04396aa0ea6a',
          '6c709948-5774-4da6-acd2-a75d77d7c92d',
          '6c256f75-bc62-4315-b7ad-e3052182197c',
          '09fe39fc-2b2f-4c42-aa19-2bcab1a67fd0',
          '6a048c9c-5604-4e37-8e29-6f136c2f5fdb',
          'cb39b3e5-4b8a-4ab6-a02c-16329061b538',
          '9cf7e042-c795-422e-8343-9c2ec2b7631e',
          '97b18d5d-d97f-4a5e-b812-7a86f180c58e',
          'c9e260ad-7536-4854-9355-dd99cd31a81b',
          '8f293e4b-5a40-4f51-bc99-9f2887b316d2',
          'dfc17e5a-e710-4ceb-8316-309a225e3d50',
          'ba7242da-1b9c-4126-9c6b-8627d6546112',
          'c120ea1f-735e-4854-a1ff-9ee6e5b8fca5',
          '777166cd-1158-43b5-9745-340685d84aa1',
          'd5ed289d-d6a4-4d9c-8d19-f28b28626dc8',
          'fdb07d31-0f06-476a-a84b-4fd323dca676',
          'bea981cb-ea46-4e34-8d68-a2b4c3e1f77d',
          'e2bcc6ed-2323-4add-8a1d-e1251e7b5cb6',
          'd0d42ab5-caef-4a9e-9b25-a0148a5367d6',
          'a01f6627-4b3e-4dc2-9ddd-d97f9b0c3eda',
          'b5f3f7c1-073e-43e2-8011-ee4065a644c9',
          '6eaa51dd-cf6e-4ab6-869b-395bd2e12057',
          'fd2c89f9-0d50-459b-bfb5-a0cbe89be3c7',
          '26429092-dd3e-4b7f-9465-8d5401c7ce3f',
          'a0588bde-9094-45a4-ae4f-128ecf0f142c',
          '126614d8-6f45-48ff-856c-15747220cbed',
          'd9980fae-d3c2-4524-b257-762dc3914f1d',
          '634a398a-d074-489c-a3d9-8ac505979f3c',
          '14383989-a647-4489-b4ca-43effa4641f8',
          'c8049ed7-7af0-464e-9339-33a974c5c2ae',
          '9428cf26-cfbe-49a7-aeb8-1763a56ab9e5',
          'fd8d7ae8-529d-451f-8bbc-90d329d0b012',
          '5d9362c2-993c-4d7e-9e78-92532e3f1ede',
          '2ac1e740-cf2d-46b6-afcf-a8dd5f74a87f',
          'ef1d0900-acc7-4366-8332-e61c93e7966e',
          '7aec0954-ef0a-4e23-9f7a-6555222fd74e',
          '59a3eb6e-30f1-47ce-9ae2-d3b754ef1819',
          '3a185b52-357f-4f8e-930c-73d37c1ddc4d',
          'c9bdf8a1-91b6-415d-a3e7-c1f8b8c1fed2',
          '2c647c12-a69c-4b7d-a60e-69fec221e70f',
          '75d56d80-cb31-465e-b370-1dac6d7ee009',
          '03cb8873-e125-4122-bf95-4b76f3103d80',
          'bf703248-193c-4723-85a9-f128982334d4',
          'e415de84-c7e9-4889-a049-fffd44fc0c46',
          'e3d4bf66-7d75-42f8-be01-07751260ee1b',
          '71814e2e-a035-4aa4-a228-4a9e0f99ecea',
          '56d38021-3d38-4f27-9d53-615ff969a864',
          '3c3fff0d-2be4-484d-9a30-e4eada805035',
          'c2614b7c-64ae-4d6d-976f-0e3a5f57cd35',
          '2cd44c5a-b0e7-4917-a945-cb719cbe0e1b',
          '49b0317a-7052-4f89-b7b3-64cb0cca63fb',
          'd1024579-371b-418b-ab86-71cfca4cdc7a',
          'f90aae68-e8c8-44ce-b57e-1bd30b4c7675',
          '4466c0de-6d6e-4c0a-af10-6e9a5cb8da95',
          'f2d83ecd-2dd1-4d51-8953-43ef537e83e6',
          '2e7e4606-53fc-4eda-82c6-dfaade30fa10',
          '876c4faf-936b-4ecf-96fe-7f2ce847feec',
          '8e003440-22b2-4825-a0bf-42ac974ec181',
          'e400143f-1215-4984-b6ce-32b7a03e8f1b',
          '2224ae75-6b59-4986-81b4-4edaef86b36c',
          '36d5ce05-2356-4dd5-8ac9-22978b1d1df4',
          'fa545604-6054-4865-9d3e-9f3cbbc63ad0',
          '865cd66e-26a2-49e5-9d4d-1ad23dc7fcd9',
          '9c47dcc7-7931-4723-a7c5-6d8c098afabf',
          'f3dbdc1b-bfd9-4245-a046-d691d37789f7',
          '86e48406-fc3d-4638-b3af-56293d6b5c70',
          'e64e5134-ab2a-4bd5-a3f1-98dcac225a47',
        ],
      },
      id: 'c567c88e-38a4-4859-b067-cf91002c5963',
      name: 'Nhà EVOL',
      icon: 'https://bein-entity-attribute-production.s3.ap-southeast-1.amazonaws.com/group/avatar/images/original/4c12ef02-2b77-434c-9114-3bd1ff18b9b0.jpg',
      privacy: 'PRIVATE' as GroupPrivacy,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      communityId: 'ca084bd1-8b57-4bcf-a80c-27efa4a79ec5',
      // eslint-disable-next-line @typescript-eslint/naming-convention
      isCommunity: true,
    };
    authUser.profile = {
      fullname: 'Diệp Phi Đằng',
      id: '3d8ec6e9-3da4-4822-b256-584cf504875c',
      username: 'phidang',
      email: 'phidang@evolgroup.vn',
      avatar:
        'https://bein-entity-attribute-production.s3.ap-southeast-1.amazonaws.com/user/avatar/images/original/897b23ef-6648-48c9-b9be-78a39d13055b.jpg',
      groups: [
        '02bf4ff3-f212-4fe9-b973-fcb2413d0db4',
        '06dc1434-55eb-43ba-b0c8-13b2a339bf5a',
        '09fe39fc-2b2f-4c42-aa19-2bcab1a67fd0',
        '11732916-01c5-482b-b486-37cd606957a8',
        '14b50a4f-05fa-49df-9784-e55fcbee36e8',
        '2e7e4606-53fc-4eda-82c6-dfaade30fa10',
        '3227628d-e987-4053-ae50-2d78ff87ff08',
        '3949f3a4-a161-4dc3-946a-a93616429cf1',
        '432a97b1-ea35-4461-9ad3-c8f7b2debc22',
        '49be6a3e-fc39-41ce-bb83-1fac579ee8c2',
        '53ca7af2-1179-4838-ab2e-e5eaca3366be',
        '6c709948-5774-4da6-acd2-a75d77d7c92d',
        '8a568caa-f26f-4525-b71e-923ef3129035',
        '90960666-1071-4cea-90b9-870edfd0d253',
        '92301557-c965-4c57-9928-7fdd8bebe621',
        '96a31a09-4bba-4949-8a63-cc37aca88b8e',
        '97b18d5d-d97f-4a5e-b812-7a86f180c58e',
        '9c2726cd-5544-4668-8465-7d39b36e1460',
        '9cf7e042-c795-422e-8343-9c2ec2b7631e',
        'b23cf63f-7cfc-4a49-8e96-9c769c02d8fe',
        'bb8d2e56-dd3f-452d-b81a-93930f00bcd8',
        'bfe112ee-14ac-4587-9dc0-f29a8df17247',
        'c03852fc-0cac-4c19-b94f-1fa928a325b1',
        'c567c88e-38a4-4859-b067-cf91002c5963',
        'c9e260ad-7536-4854-9355-dd99cd31a81b',
        'd28d8600-905e-48ea-9239-11511d40a9e3',
        'e2bcc6ed-2323-4add-8a1d-e1251e7b5cb6',
        'f3dbdc1b-bfd9-4245-a046-d691d37789f7',
        'fb688cd9-8acf-47a2-a584-20633bace927',
        'fd576b39-fe96-4dc8-b92f-4aa06b0dc14a',
      ],
    };
    const groupIds = this._groupService.getGroupIdAndChildIdsUserJoined(group, authUser);
    if (groupIds.length === 0) {
      return new PageDto<PostResponseDto>([], {
        limit,
        offset,
        hasNextPage: false,
      });
    }

    const authUserId = authUser?.id || null;
    const postIdsAndSorted = await this._postService.getPostIdsInGroupIds(groupIds, {
      offset,
      limit: limit + 1,
      authUserId,
    });

    let hasNextPage = false;
    if (postIdsAndSorted.length > limit) {
      postIdsAndSorted.pop();
      hasNextPage = true;
    }
    this._logger.debug('[GET TIMELINE GROUPIDS]', groupIds.join('***'));
    this._logger.debug('[GET TIMELINE BEFORE]', postIdsAndSorted.join('***'));
    const posts = await this._postService.getPostsByIds(postIdsAndSorted, authUserId);
    this._logger.debug('[GET TIMELINE AFTER]', posts.map((p) => p.id).join('***'));
    const postsBindedData = await this._bindAndTransformData({
      posts,
      authUser,
    });

    return new PageDto<PostResponseDto>(postsBindedData, {
      limit,
      offset,
      hasNextPage,
    });
  }

  /**
   * Delete newsfeed by post
   */
  public deleteNewsFeedByPost(postId: string, transaction: Transaction): Promise<number> {
    return this._newsFeedModel.destroy({ where: { postId }, transaction: transaction });
  }

  public deleteUserSeenByPost(postId: string, transaction: Transaction): Promise<number> {
    return this._userSeenPostModel.destroy({ where: { postId }, transaction: transaction });
  }
}
