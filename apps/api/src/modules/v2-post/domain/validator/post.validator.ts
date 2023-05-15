import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { PostType } from '../../data-type';
import {
  IPostRepository,
  POST_REPOSITORY_TOKEN,
} from '../repositoty-interface/post.repository.interface';
import { IPostValidator } from './interface';
import { ContentValidator } from './content.validator';
import {
  GROUP_APPLICATION_TOKEN,
  GroupDto,
  IGroupApplicationService,
} from '../../../v2-group/application';
import {
  AUTHORITY_APP_SERVICE_TOKEN,
  IAuthorityAppService,
} from '../../../authority/application/authority.app-service.interface';
import { LogicException } from '../../../../common/exceptions';
import { HTTP_STATUS_ID } from '../../../../common/constants';
import { PostEntity } from '../model/content';
import {
  IUserApplicationService,
  USER_APPLICATION_TOKEN,
  UserDto,
} from '../../../v2-user/application';
import { ContentEmptyException } from '../exception/content-empty.exception';
import { ITagRepository, TAG_REPOSITORY_TOKEN } from '../repositoty-interface';
import { TagSeriesInvalidException } from '../exception/tag-series-invalid.exception';

@Injectable()
export class PostValidator extends ContentValidator implements IPostValidator {
  public constructor(
    @Inject(GROUP_APPLICATION_TOKEN)
    protected _groupAppService: IGroupApplicationService,
    @Inject(USER_APPLICATION_TOKEN)
    protected readonly _userApplicationService: IUserApplicationService,
    @Inject(AUTHORITY_APP_SERVICE_TOKEN)
    protected _authorityAppService: IAuthorityAppService,
    @Inject(POST_REPOSITORY_TOKEN)
    private readonly _postRepository: IPostRepository,
    @Inject(TAG_REPOSITORY_TOKEN)
    private readonly _tagRepository: ITagRepository
  ) {
    super(_groupAppService, _userApplicationService, _authorityAppService);
  }

  public async validateSeriesAndTags(
    groups: GroupDto[],
    seriesIds: string[],
    tagIds: string[]
  ): Promise<void> {
    const seriesTagErrorData = {
      seriesIds: [],
      tagIds: [],
      seriesNames: [],
      tagNames: [],
    };
    if (seriesIds?.length) {
      const groupIds = groups.map((e) => e.id);
      const series = await this._postRepository.findAll({
        attributes: ['id', 'title', 'groups'],
        include: {
          mustIncludeGroup: true,
        },
        where: {
          ids: seriesIds,
          type: PostType.SERIES,
          groupArchived: true,
        },
      });
      series.forEach((item) => {
        const isValid = item.get('groupIds').some((groupId) => groupIds.includes(groupId));
        if (!isValid) {
          seriesTagErrorData.seriesIds.push(item.get('id'));
          seriesTagErrorData.seriesNames.push(item.get('title'));
        }
      });
    }

    if (tagIds?.length) {
      const tags = await this._tagRepository.findAll({ ids: tagIds });
      const rootGroupIds = groups.map((e) => e.rootGroupId);
      const invalidTags = tags.filter((tagInfo) => !rootGroupIds.includes(tagInfo.get('groupId')));
      if (invalidTags) {
        invalidTags.forEach((e) => {
          seriesTagErrorData.tagIds.push(e.get('id'));
          seriesTagErrorData.tagNames.push(e.get('name'));
        });
      }
    }

    if (seriesTagErrorData.seriesIds.length || seriesTagErrorData.tagIds.length) {
      throw new TagSeriesInvalidException(seriesTagErrorData);
    }

    //TODO: validate tags
  }

  public async validatePublishContent(
    postEntity: PostEntity,
    userAuth: UserDto,
    groupIds: string[]
  ): Promise<void> {
    await super.validatePublishContent(postEntity, userAuth, groupIds);
    if (
      !postEntity.get('content') &&
      postEntity.get('media')?.files.length === 0 &&
      postEntity.get('media')?.videos.length === 0 &&
      postEntity.get('media')?.images.length === 0
    ) {
      throw new ContentEmptyException();
    }
  }
}
