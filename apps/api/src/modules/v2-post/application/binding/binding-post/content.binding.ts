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
import { IContentBinding } from './content.interface';
import { ArrayHelper } from '../../../../../common/helpers';
import { SeriesEntity } from '../../../domain/model/content/series.entity';
import { GroupPrivacy } from '../../../../v2-group/data-type';
import { ReactionsCount } from '../../../domain/query-interface/reaction.query.interface';

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
      series?: SeriesEntity[];
      authUser?: UserDto;
      reactionCount?: ReactionsCount;
    }
  ): Promise<PostDto> {
    const userIdsNeedToFind = [];
    if (!dataBinding?.actor) {
      userIdsNeedToFind.push(postEntity.get('createdBy'));
    }
    let mentionUsers: UserMentionDto = {};
    if (postEntity.get('mentionUserIds')?.length && !dataBinding?.mentionUsers) {
      userIdsNeedToFind.push(...postEntity.get('mentionUserIds'));
    }

    const users = await this._userApplicationService.findAllByIds(userIdsNeedToFind, {
      withGroupJoined: false,
    });
    if (dataBinding?.mentionUsers?.length) {
      users.push(...dataBinding?.mentionUsers);
    }

    if (dataBinding?.actor) {
      delete dataBinding.actor.permissions;
      delete dataBinding.actor.groups;
      users.push(dataBinding.actor);
    }

    const actor = users.find((user) => user.id === postEntity.get('createdBy'));
    if (postEntity.get('mentionUserIds') && users.length) {
      mentionUsers = this.mapMentionWithUserInfo(
        users.filter((user) => postEntity.get('mentionUserIds').includes(user.id))
      );
    }

    const groups =
      dataBinding?.groups ||
      (await this._groupApplicationService.findAllByIds(postEntity.get('groupIds')));

    const audience = {
      groups: this.filterSecretGroupCannotAccess(groups, dataBinding?.authUser || null),
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
        groupId: tag.get('groupId'),
      })),
      series: dataBinding.series
        ? dataBinding.series.map((series) => ({
            id: series.get('id'),
            title: series.get('title'),
          }))
        : undefined,
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
      linkPreview: postEntity.get('linkPreview')
        ? {
            url: postEntity.get('linkPreview').get('url'),
            title: postEntity.get('linkPreview').get('title'),
            description: postEntity.get('linkPreview').get('description'),
            image: postEntity.get('linkPreview').get('image'),
            domain: postEntity.get('linkPreview').get('domain'),
          }
        : null,
      markedReadPost: postEntity.get('markedReadImportant'),
      isSaved: postEntity.get('isSaved'),
      isReported: postEntity.get('isReported'),
      reactionsCount: dataBinding?.reactionCount || [],
      ownerReactions: postEntity.get('ownerReactions'),
    });
  }

  /**
   * Map mentions to UserInfo
   * @param users UserDto[]
   * returns UserMentionDto
   */
  public mapMentionWithUserInfo(users: UserDto[]): UserMentionDto {
    return users.reduce((returnValue, current) => {
      return {
        ...returnValue,
        [current.username]: {
          id: current.id,
          fullname: current.fullname,
          email: current.email,
          username: current.username,
          avatar: current.avatar,
        },
      };
    }, {});
  }

  public filterSecretGroupCannotAccess(groups: GroupDto[], authUser?: UserDto): GroupDto[] {
    return groups.filter((group) => {
      const isUserNotInGroup = authUser?.groups.includes(group.id);
      const isGuest = !authUser;
      return !(group.privacy === GroupPrivacy.SECRET && (isUserNotInGroup || isGuest));
    });
  }
}
