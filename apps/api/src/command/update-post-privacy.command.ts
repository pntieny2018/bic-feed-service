import { ContentEmptyGroupException } from '@api/modules/v2-post/domain/exception';
import { CONTENT_STATUS, PRIVACY } from '@beincom/constants';
import { PostModel } from '@libs/database/postgres/model';
import { GROUP_SERVICE_TOKEN, IGroupService } from '@libs/service/group';
import { Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Command, CommandRunner } from 'nest-commander';

@Command({ name: 'post:update-privacy', description: 'Update privacy for all posts' })
export class UpdatePrivacyPostCommand implements CommandRunner {
  public constructor(
    @InjectModel(PostModel) private _postModel: typeof PostModel,
    @Inject(GROUP_SERVICE_TOKEN) private _groupService: IGroupService
  ) {}

  public async run(): Promise<any> {
    try {
      const posts = await this._postModel.findAll({
        attributes: ['id'],
        raw: true,
        where: {
          privacy: null,
          status: CONTENT_STATUS.PUBLISHED,
        },
      });
      for (const post of posts) {
        await this._updatePrivacy(post.id);
        console.log(`Updated ${post.id}`);
      }
      console.log(`Total ${posts.length}. DONE!`);
    } catch (e) {
      console.log(e);
    }
    process.exit();
  }

  private async _updatePrivacy(postId: string): Promise<void> {
    const post = await this._postModel.findOne({ where: { id: postId } });
    if (post.groups.length === 0) {
      return;
    }
    const groupIds = post.groups.map((g) => g.groupId);
    const privacy = await this._getPrivacy(groupIds);
    await this._postModel.update(
      { privacy },
      {
        where: {
          id: postId,
        },
      }
    );
  }

  public async _getPrivacy(groupIds: string[]): Promise<PRIVACY> {
    if (groupIds.length === 0) {
      throw new ContentEmptyGroupException();
    }
    const groups = await this._groupService.findAllByIds(groupIds);
    let totalPrivate = 0;
    let totalOpen = 0;
    for (const group of groups) {
      if (group.privacy === PRIVACY.OPEN) {
        return PRIVACY.OPEN;
      }
      if (group.privacy === PRIVACY.CLOSED) {
        totalOpen++;
      }
      if (group.privacy === PRIVACY.PRIVATE) {
        totalPrivate++;
      }
    }

    if (totalOpen > 0) {
      return PRIVACY.CLOSED;
    }
    if (totalPrivate > 0) {
      return PRIVACY.PRIVATE;
    }
    return PRIVACY.SECRET;
  }
}
