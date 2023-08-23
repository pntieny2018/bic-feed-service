import { IsUUID } from 'class-validator';
import {
  BelongsTo,
  Column,
  CreatedAt,
  ForeignKey,
  Model,
  PrimaryKey,
  Sequelize,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import { PostModel } from './post.model';
import { Literal } from 'sequelize/types/utils';
import { PostGroupModel } from './post-group.model';
import { getDatabaseConfig } from '../../config/database';

export interface IPostSeries {
  postId: string;
  seriesId: string;
  zindex: number;
  createdAt?: Date;
  updatedAt?: Date;
}
@Table({
  tableName: 'posts_series',
  timestamps: false,
})
export class PostSeriesModel extends Model implements IPostSeries {
  @ForeignKey(() => PostModel)
  @PrimaryKey
  @IsUUID()
  @Column
  public postId: string;

  @ForeignKey(() => PostModel)
  @PrimaryKey
  @IsUUID()
  @Column
  public seriesId: string;

  @Column
  public zindex: number;

  @BelongsTo(() => PostModel, 'postId')
  public post?: PostModel;

  @BelongsTo(() => PostModel, 'seriesId')
  public series?: PostModel;

  @CreatedAt
  @Column
  public createdAt?: Date;

  @UpdatedAt
  @Column
  public updatedAt?: Date;

  public static filterInGroupArchivedCondition(groupArchived: boolean): Literal {
    const { schema } = getDatabaseConfig();
    const postGroupTable = PostGroupModel.tableName;
    return Sequelize.literal(
      `EXISTS (
        SELECT seriesGroups.post_id FROM ${schema}.${postGroupTable} as seriesGroups
          WHERE seriesGroups.post_id = "postSeries".series_id AND seriesGroups.is_archived = ${groupArchived}
        )`
    );
  }
}
