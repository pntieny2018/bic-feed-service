import { IQuery } from '@nestjs/cqrs';
import { PostEntity } from '../../../domain/model/content';
import {
  IUserApplicationService,
  USER_APPLICATION_TOKEN,
  UserDto,
} from '../../../../v2-user/application';
import { Inject, Injectable } from '@nestjs/common';
import { FileDto, ImageDto, PostDto, UserMentionDto, VideoDto } from '../../dto';
import {
  GROUP_APPLICATION_TOKEN,
  GroupDto,
  IGroupApplicationService,
} from '../../../../v2-group/application';
import { PostStatus } from '../../../data-type/post-status.enum';
import { PostPrivacy, PostType } from '../../../data-type';
import { IContentBinding } from './content.interface';
import { ArrayHelper } from '../../../../../common/helpers';

type Props = {
  name?: string;
  level?: number;
  isCreatedByMe?: boolean;
  offset: number;
  limit: number;
};

@Injectable()
export class ContentBinding implements IContentBinding {
  public constructor(
    @Inject(GROUP_APPLICATION_TOKEN)
    private readonly _groupApplicationService: IGroupApplicationService,
    @Inject(USER_APPLICATION_TOKEN)
    private readonly _userApplicationService: IUserApplicationService
  ) {}
  public async postBinding(
    postEntity: PostEntity,
    dataBinding?: {
      actor?: UserDto;
      mentionUsers?: UserDto[];
      groups?: GroupDto[];
    }
  ): Promise<PostDto> {
    let actor = null;
    const userIdsNeedToFind = [];
    if (!dataBinding?.actor) {
      userIdsNeedToFind.push(postEntity.get('createdBy'));
    }
    const mentionUsers = {};
    if (postEntity.get('mentionUserIds')?.length && !dataBinding?.mentionUsers) {
      userIdsNeedToFind.push(...postEntity.get('mentionUserIds'));
    }

    if (userIdsNeedToFind.length) {
      const users = await this._userApplicationService.findAllByIds(userIdsNeedToFind);
      const usersMap = users.reduce((obj, cur) => ({ ...obj, [cur.id]: cur }), {});
      actor = usersMap[postEntity.get('createdBy')];
      if (postEntity.get('mentionUserIds')) {
        for (const mentionUserId of postEntity.get('mentionUserIds')) {
          const findUser = usersMap[mentionUserId];
          if (findUser) {
            mentionUsers[findUser.username] = findUser;
          }
        }
      }
    }

    const audience = {
      groups:
        dataBinding?.groups ||
        (await this._groupApplicationService.findAllByIds(postEntity.get('groupIds'))),
    };

    const communities = await this._groupApplicationService.findAllByIds(
      ArrayHelper.arrayUnique(audience.groups.map((group) => group.rootGroupId))
    );

    return new PostDto({
      id: postEntity.get('id'),
      audience,
      content: postEntity.get('content'),
      createdAt: postEntity.get('createdAt'),
      tags: postEntity.get('tags').map((tag) => ({
        id: tag.get('id'),
        name: tag.get('name'),
      })),
      series: postEntity.get('seriesIds'),
      communities,
      media: {
        files: postEntity.get('media').files.map((file) => new FileDto(file.toObject())),
        images: postEntity.get('media').images.map((image) => new ImageDto(image.toObject())),
        videos: postEntity.get('media').videos.map((video) => new VideoDto(video.toObject())),
      },
      mentions: mentionUsers,
      actor,
      status: postEntity.get('status'),
      type: postEntity.get('type'),
      privacy: postEntity.get('privacy'),
      setting: postEntity.get('setting'),
      commentsCount: postEntity.get('aggregation').commentsCount,
      totalUsersSeen: postEntity.get('aggregation').totalUsersSeen,
      markedReadPost: true,
      isSaved: false,
      reactionsCount: {},
      ownerReactions: [],
    });
  }
}
