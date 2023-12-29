import {
  AllowNull,
  Column,
  CreatedAt,
  Default,
  Length,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
  Sequelize,
} from 'sequelize-typescript';
import { Optional } from 'sequelize';
import { IsUUID } from 'class-validator';
import { v4 as uuid_v4 } from 'uuid';
import { Literal } from 'sequelize/types/utils';
import { PostModel } from './post.model';
import { PostTagModel } from './post-tag.model';
import { getDatabaseConfig } from '@libs/database/postgres/config';

export interface ITag {
  id: string;
  groupId: string;
  name: string;
  slug: string;
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
  totalUsed: number;
}

@Table({
  tableName: 'tags',
})
export class TagModel extends Model<ITag, Optional<ITag, 'id'>> implements ITag {
  @PrimaryKey
  @IsUUID()
  @Default(() => uuid_v4())
  @Column
  public id: string;

  @Column
  public groupId: string;

  @Length({ max: 255 })
  @Column
  public name: string;

  @Length({ max: 255 })
  @Column
  public slug: string;

  @AllowNull(false)
  @Column
  public totalUsed: number;

  @AllowNull(false)
  @Column
  public createdBy: string;

  @AllowNull(false)
  @Column
  public updatedBy: string;

  @CreatedAt
  @Column
  public createdAt: Date;

  @UpdatedAt
  @Column
  public updatedAt: Date;

  public static loadTotalUsed(): [Literal, string] {
    const { schema } = getDatabaseConfig();

    return [
      Sequelize.literal(`CAST((
            SELECT COUNT(*)
            FROM ${schema}.${PostModel.tableName} p
            JOIN ${schema}.${PostTagModel.tableName} pt ON pt.post_id = p.id
            WHERE pt.tag_id = "TagModel".id AND p.is_hidden = false AND p.status = 'PUBLISHED'
          ) AS INTEGER)`),
      'totalUsed',
    ];
  }

  public static loadAllAttributes(): Array<string | [Literal, string]> {
    return [
      'id',
      'name',
      'slug',
      'groupId',
      'createdAt',
      'updatedAt',
      'createdBy',
      'updatedBy',
      TagModel.loadTotalUsed(),
    ];
  }
}
