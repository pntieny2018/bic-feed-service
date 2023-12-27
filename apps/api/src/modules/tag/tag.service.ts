import { GROUP_SERVICE_TOKEN, IGroupService } from '@libs/service/group';
import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, Transaction } from 'sequelize';

import { ArrayHelper } from '../../common/helpers';
import { PostTagModel } from '../../database/models/post-tag.model';
import { ITag, TagModel } from '../../database/models/tag.model';

@Injectable()
export class TagService {
  public constructor(
    @InjectModel(TagModel) private _tagModel: typeof TagModel,
    @InjectModel(PostTagModel) private _postTagModel: typeof PostTagModel,
    @Inject(GROUP_SERVICE_TOKEN)
    private readonly _groupAppService: IGroupService
  ) {}

  public async updateToPost(
    tagIds: string[],
    postId: string,
    transaction?: Transaction
  ): Promise<void> {
    const currentTags = await this._postTagModel.findAll({
      where: { postId },
    });
    const currentTagIds = currentTags.map((i) => i.tagId);

    const deleteIds = ArrayHelper.arrDifferenceElements(currentTagIds, tagIds);
    if (deleteIds.length) {
      await this._postTagModel.destroy({
        where: { tagId: deleteIds, postId },
        transaction,
      });
    }

    const addIds = ArrayHelper.arrDifferenceElements(tagIds, currentTagIds);
    if (addIds.length) {
      await this._postTagModel.bulkCreate(
        addIds.map((tagId) => ({
          postId,
          tagId,
        })),
        { transaction }
      );
    }
  }

  public async getTagsByIds(ids: string[]): Promise<ITag[]> {
    const tags = await this._tagModel.findAll({ where: { id: { [Op.in]: ids } } });
    return tags;
  }

  public async increaseTotalUsed(ids: string[], transaction?: Transaction): Promise<void> {
    const tags = await this._tagModel.findAll({ where: { id: ids } });
    for (const tag of tags) {
      if (transaction) {
        await tag.update({ totalUsed: tag.totalUsed + 1 }, { transaction });
      } else {
        await tag.update({ totalUsed: tag.totalUsed + 1 });
      }
    }
  }

  public async decreaseTotalUsed(ids: string[], transaction?: Transaction): Promise<void> {
    const tags = await this._tagModel.findAll({ where: { id: ids } });
    for (const tag of tags) {
      if (transaction) {
        await tag.update({ totalUsed: tag.totalUsed - 1 }, { transaction });
      } else {
        await tag.update({ totalUsed: tag.totalUsed - 1 });
      }
    }
  }

  public async getInvalidTagsByAudience(
    tagIds: string[],
    audienceGroupIds: string[]
  ): Promise<ITag[]> {
    const tagsInfos = await this._tagModel.findAll({ where: { id: tagIds } });
    const audienceGroupInfos = await this._groupAppService.findAllByIds(audienceGroupIds);
    const audienceRootGroupIds = audienceGroupInfos.map((e) => e.rootGroupId);
    const invalidTags = tagsInfos.filter(
      (tagInfo) => !audienceRootGroupIds.includes(tagInfo.groupId)
    );
    if (invalidTags.length) {
      return invalidTags;
    }
    return [];
  }

  public async findTag(name: string, groupId: string): Promise<string> {
    const tag = await this._tagModel.findOne({
      where: {
        name: name,
        groupId: groupId,
      },
    });
    if (!tag) {
      return null;
    }
    return tag.id;
  }
}
