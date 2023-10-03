import { getDatabaseConfig } from '@libs/database/postgres/common';
import { PostTagModel } from '@libs/database/postgres/model/post-tag.model';
import { PostModel } from '@libs/database/postgres/model/post.model';
import { TagModel } from '@libs/database/postgres/model/tag.model';
import { InjectConnection } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize';
import { BaseRepository } from '@libs/database/postgres/repository/base.repository';

export class LibTagRepository extends BaseRepository<TagModel> {
  public constructor(@InjectConnection() private readonly _sequelizeConnection: Sequelize) {
    super(TagModel);
  }

  public loadTotalUsed(): [string, string] {
    const { schema } = getDatabaseConfig();

    return [
      `CAST((
            SELECT COUNT(*)
            FROM ${schema}.${PostModel.tableName} p
            JOIN ${schema}.${PostTagModel.tableName} pt ON pt.post_id = p.id
            WHERE pt.tag_id = "TagModel".id AND p.is_hidden = false AND p.status = 'PUBLISHED'
          ) AS INTEGER)`,
      'totalUsed',
    ];
  }
}
