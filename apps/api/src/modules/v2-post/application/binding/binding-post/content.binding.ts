import { PostEntity, SeriesEntity } from '../../../domain/model/content';
import {
  IUserApplicationService,
  USER_APPLICATION_TOKEN,
  UserDto,
} from '../../../../v2-user/application';
import { Inject, Injectable } from '@nestjs/common';
import { FileDto, ImageDto, PostDto, UserMentionDto, VideoDto, SeriesDto } from '../../dto';
import {
  GROUP_APPLICATION_TOKEN,
  GroupDto,
  IGroupApplicationService,
} from '../../../../v2-group/application';
import { IContentBinding } from './content.interface';
import { ArrayHelper } from '../../../../../common/helpers';
import { GroupPrivacy } from '../../../../v2-group/data-type';
import { ReactionsCount } from '../../../domain/query-interface/reaction.query.interface';
import { ArticleEntity } from '../../../domain/model/content/article.entity';
import { ArticleDto } from '../../dto/article.dto';

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
      reactionsCount?: ReactionsCount;
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
      commentsCount: postEntity.get('aggregation')?.commentsCount,
      totalUsersSeen: postEntity.get('aggregation')?.totalUsersSeen,
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
      reactionsCount: dataBinding?.reactionsCount || [],
      ownerReactions: postEntity.get('ownerReactions'),
    });
  }

  public async articleBinding(
    articleEntity: ArticleEntity,
    dataBinding?: {
      actor?: UserDto;
      groups?: GroupDto[];
      series?: SeriesEntity[];
      authUser?: UserDto;
      reactionsCount?: ReactionsCount;
    }
  ): Promise<ArticleDto> {
    const userIdsNeedToFind = [];
    if (!dataBinding?.actor) {
      userIdsNeedToFind.push(articleEntity.get('createdBy'));
    }

    const users = await this._userApplicationService.findAllByIds(userIdsNeedToFind, {
      withGroupJoined: false,
    });

    if (dataBinding?.actor) {
      delete dataBinding.actor.permissions;
      delete dataBinding.actor.groups;
      users.push(dataBinding.actor);
    }

    const actor = users.find((user) => user.id === articleEntity.get('createdBy'));

    const groups =
      dataBinding?.groups ||
      (await this._groupApplicationService.findAllByIds(articleEntity.get('groupIds')));

    const audience = {
      groups: this.filterSecretGroupCannotAccess(groups, dataBinding?.authUser || null),
    };

    const communities = await this._groupApplicationService.findAllByIds(
      ArrayHelper.arrayUnique(audience.groups.map((group) => group.rootGroupId))
    );

    return new ArticleDto({
      id: articleEntity.get('id'),
      audience,
      content: articleEntity.get('content'),
      createdAt: articleEntity.get('createdAt'),
      tags: articleEntity.get('tags').map((tag) => ({
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
      actor,
      status: articleEntity.get('status'),
      type: articleEntity.get('type'),
      privacy: articleEntity.get('privacy'),
      setting: articleEntity.get('setting'),
      commentsCount: articleEntity.get('aggregation').commentsCount,
      totalUsersSeen: articleEntity.get('aggregation').totalUsersSeen,
      markedReadPost: articleEntity.get('markedReadImportant'),
      isSaved: articleEntity.get('isSaved'),
      isReported: articleEntity.get('isReported'),
      reactionsCount: dataBinding?.reactionsCount || [],
      ownerReactions: articleEntity.get('ownerReactions'),
      coverMedia: new ImageDto(articleEntity.get('cover').toObject()),
      categories: articleEntity.get('categories')?.map((category) => ({
        id: category.get('id'),
        name: category.get('name'),
      })),
    });
  }

  public async seriesBinding(
    seriesEntity: SeriesEntity,
    dataBinding?: {
      actor: UserDto;
      groups?: GroupDto[];
    }
  ): Promise<SeriesDto> {
    const groups =
      dataBinding?.groups ||
      (await this._groupApplicationService.findAllByIds(seriesEntity.get('groupIds')));

    const audience = {
      groups: this.filterSecretGroupCannotAccess(groups, dataBinding.actor),
    };

    const communities = await this._groupApplicationService.findAllByIds(
      ArrayHelper.arrayUnique(audience.groups.map((group) => group.rootGroupId))
    );

    return new SeriesDto({
      id: seriesEntity.get('id'),
      title: seriesEntity.get('title'),
      summary: seriesEntity.get('summary'),
      audience,
      createdAt: seriesEntity.get('createdAt'),
      updatedAt: seriesEntity.get('updatedAt'),
      createdBy: seriesEntity.get('createdBy'),
      coverMedia: new ImageDto(seriesEntity.get('cover')?.toObject()),
      communities,
      actor: dataBinding.actor,
      status: seriesEntity.get('status'),
      type: seriesEntity.get('type'),
      privacy: seriesEntity.get('privacy'),
      isHidden: seriesEntity.get('isHidden'),
      setting: seriesEntity.get('setting'),
      commentsCount: seriesEntity.get('aggregation')?.commentsCount || 0,
      totalUsersSeen: seriesEntity.get('aggregation')?.totalUsersSeen || 0,
      markedReadPost: false,
      isSaved: false,
      reactionsCount: {},
      ownerReactions: [],
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
