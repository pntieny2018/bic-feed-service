import { Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { PaginationResult } from '../../../../common/types/pagination-result.type';
import { TagModel } from '../../../../database/models/tag.model';
import { TagEntity } from '../../domain/model/tag';
import { GetPaginationTagProps, ITagQuery } from '../../domain/query-interface';
import { ITagFactory, TAG_FACTORY_TOKEN } from '../../domain/factory';
import { PostModel, PostStatus } from '../../../../database/models/post.model';
import { PostTagModel } from '../../../../database/models/post-tag.model';

export class TagQuery implements ITagQuery {
  @Inject(TAG_FACTORY_TOKEN) private readonly _factory: ITagFactory;
  @InjectModel(TagModel)
  private readonly _tagModel: typeof TagModel;
  @InjectModel(PostTagModel)
  private readonly _postTagModel: typeof PostTagModel;

  public async getPagination(input: GetPaginationTagProps): Promise<PaginationResult<TagEntity>> {
    const { offset, limit, name, groupIds } = input;
    const conditions = {};
    if (groupIds && groupIds.length) {
      conditions['groupId'] = groupIds;
    }
    if (name) {
      conditions['name'] = { [Op.iLike]: name + '%' };
    }
    const { rows, count } = await this._tagModel.findAndCountAll({
      where: conditions,
      offset,
      limit,
      order: [
        ['totalUsed', 'DESC'],
        ['createdAt', 'DESC'],
      ],
    });
    const tagIds = rows.map((row) => row.id);
    const postTagData = await this._postTagModel.findAll({
      where: {
        tagId: tagIds,
      },
      include: [
        {
          model: PostModel,
          as: 'post',
          where: {
            status: PostStatus.PUBLISHED,
            isHidden: false,
          },
        },
      ],
    });
    for (const row of rows) {
      row.totalUsed = postTagData.filter((postTag) => postTag.tagId === row.id).length;
    }
    const result = rows.map((row) => this._factory.reconstitute(row));
    return {
      rows: result,
      total: count,
    };
  }
}
