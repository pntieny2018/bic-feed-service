import { getDatabaseConfig } from '@libs/database/postgres/common';
import { PostTagModel, PostModel, TagModel } from '@libs/database/postgres/model';
import { BaseRepository } from '@libs/database/postgres/repository';
import { InjectConnection } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize';

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
