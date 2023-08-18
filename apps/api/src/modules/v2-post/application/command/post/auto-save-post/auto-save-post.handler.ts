import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import {
  GROUP_APPLICATION_TOKEN,
  IGroupApplicationService,
} from '../../../../../v2-group/application';
import {
  IUserApplicationService,
  USER_APPLICATION_TOKEN,
} from '../../../../../v2-user/application';
import {
  IPostDomainService,
  POST_DOMAIN_SERVICE_TOKEN,
} from '../../../../domain/domain-service/interface';
import { PostEntity } from '../../../../domain/model/content';
import {
  IContentRepository,
  CONTENT_REPOSITORY_TOKEN,
} from '../../../../domain/repositoty-interface';

import { AutoSavePostCommand } from './auto-save-post.command';

@CommandHandler(AutoSavePostCommand)
export class AutoSavePostHandler implements ICommandHandler<AutoSavePostCommand, void> {
  public constructor(
    @Inject(CONTENT_REPOSITORY_TOKEN) private readonly _contentRepository: IContentRepository,
    @Inject(POST_DOMAIN_SERVICE_TOKEN) private readonly _postDomainService: IPostDomainService,
    @Inject(GROUP_APPLICATION_TOKEN)
    private readonly _groupApplicationService: IGroupApplicationService,
    @Inject(USER_APPLICATION_TOKEN)
    private readonly _userApplicationService: IUserApplicationService
  ) {}

  public async execute(command: AutoSavePostCommand): Promise<void> {
    const { id, groupIds, mentionUserIds } = command.payload;
    const postEntity = await this._contentRepository.findOne({
      where: {
        id,
        groupArchived: false,
      },
      include: {
        shouldIncludeGroup: true,
        shouldIncludeSeries: true,
        shouldIncludeLinkPreview: true,
      },
    });
    if (!postEntity || !(postEntity instanceof PostEntity) || postEntity.isHidden()) {
      return;
    }

    if (postEntity.isPublished()) {
      return;
    }

    let groups = undefined;
    if (groupIds || postEntity.get('groupIds')) {
      groups = await this._groupApplicationService.findAllByIds(
        groupIds || postEntity.get('groupIds')
      );
    }
    const mentionUsers = await this._userApplicationService.findAllByIds(mentionUserIds, {
      withGroupJoined: true,
    });
    await this._postDomainService.autoSavePost({
      postEntity: postEntity as PostEntity,
      newData: {
        ...command.payload,
        mentionUsers,
        groups,
      },
    });
  }
}
