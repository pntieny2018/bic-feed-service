import { PageDto, PageMetaDto } from '@api/common/dto';
import { DomainForbiddenException } from '@api/common/exceptions';
import {
  CONTENT_DOMAIN_SERVICE_TOKEN,
  IContentDomainService,
} from '@api/modules/v2-post/domain/domain-service/interface';
import {
  IUserSeenContentRepository,
  USER_SEEN_CONTENT_REPOSITORY_TOKEN,
} from '@api/modules/v2-post/domain/repositoty-interface';
import {
  GROUP_ADAPTER,
  IGroupAdapter,
  IUserAdapter,
  USER_ADAPTER,
} from '@api/modules/v2-post/domain/service-adapter-interface';
import { PRIVACY } from '@beincom/constants';
import { UserDto } from '@libs/service/user';
import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { UsersSeenContentQuery } from './users-seen-content.query';

@QueryHandler(UsersSeenContentQuery)
export class UsersSeenContentHandler
  implements IQueryHandler<UsersSeenContentQuery, PageDto<UserDto>>
{
  public constructor(
    @Inject(CONTENT_DOMAIN_SERVICE_TOKEN)
    private readonly _contentDomain: IContentDomainService,
    @Inject(USER_SEEN_CONTENT_REPOSITORY_TOKEN)
    private readonly _userSeenContentRepo: IUserSeenContentRepository,
    @Inject(GROUP_ADAPTER)
    private readonly _groupAdapter: IGroupAdapter,
    @Inject(USER_ADAPTER)
    private readonly _userService: IUserAdapter
  ) {}

  public async execute(query: UsersSeenContentQuery): Promise<PageDto<UserDto>> {
    const { contentId, authUser, limit, offset } = query.payload;

    const content = await this._contentDomain.getVisibleContent(contentId);
    const groupsOfUser = authUser.groups;
    const contentGroupIds = content.getGroupIds();
    const groupInfos = await this._groupAdapter.getGroupsByIds(contentGroupIds);

    const privacy = groupInfos.map((g) => g.privacy);

    if (privacy.every((p) => p !== PRIVACY.CLOSED && p !== PRIVACY.OPEN)) {
      if (!contentGroupIds.some((groupId) => groupsOfUser.includes(groupId))) {
        throw new DomainForbiddenException();
      }
    }

    const userIds = await this._userSeenContentRepo.findUserIdsSeen({
      contentId: contentId,
      limit,
      offset,
    });

    const total = await this._userSeenContentRepo.getTotalUsersSeen(contentId);

    const users = await this._userService.getUsersByIds(userIds);

    return new PageDto<UserDto>(
      users,
      new PageMetaDto({
        total: total ?? 0,
        pageOptionsDto: {
          limit: limit || 20,
          offset: offset || 0,
        },
      })
    );
  }
}
