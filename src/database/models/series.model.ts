import {
  AllowNull,
  Column,
  CreatedAt,
  Model,
  PrimaryKey,
  Table,
  Default,
  UpdatedAt,
} from 'sequelize-typescript';
import { IsUUID } from 'class-validator';
import { v4 as uuid_v4 } from 'uuid';
import { getDatabaseConfig } from '../../config/database';
import { PostSeriesModel } from './post-series.model';
import { PostModel } from './post.model';
import { QueryTypes } from 'sequelize';

export interface ISeries {
  id?: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdBy: number;
  updatedBy: number;
  totalArticle: number;
  totalView: number;
  createdAt: Date;
  updatedAt: Date;
}

@Table({
  tableName: 'series',
})
export class SeriesModel extends Model<ISeries, Omit<ISeries, 'id'>> implements ISeries {
  @PrimaryKey
  @IsUUID()
  @Default(() => uuid_v4())
  @Column
  public id: string;

  @Column
  public name: string;

  @Column
  public slug: string;

  @Column
  public isActive: boolean;

  @Column
  public createdBy: number;

  @Column
  public updatedBy: number;

  @Column
  public totalArticle: number;

  @Column
  public totalView: number;

  @CreatedAt
  @Column
  public createdAt: Date;

  @UpdatedAt
  @Column
  public updatedAt: Date;

  public static async updateTotalArticle(seriesIds: string[]): Promise<void> {
    const { schema } = getDatabaseConfig();
    const postSeriesTable = PostSeriesModel.tableName;
    const seriesTable = SeriesModel.tableName;
    const postTable = PostModel.tableName;
    if (seriesIds.length === 0) return;
    const query = `UPDATE ${schema}.${seriesTable}
                SET total_article = tmp.tt_article
                FROM (
                  SELECT ps.series_id, COUNT(ps.post_id) as tt_article
                  FROM ${schema}.${seriesTable} AS s
                  LEFT JOIN ${schema}.${postSeriesTable} AS ps ON ps.series_id = s.id
                  LEFT JOIN ${schema}.${postTable} AS p ON p.id = ps.post_id AND p.is_article = true AND p.is_draft = false
                  WHERE s.id IN (:seriesIds)
                  GROUP BY s.id
                ) as tmp
                WHERE tmp.series_id = ${schema}.${seriesTable}.id`;
    await this.sequelize.query(query, {
      replacements: {
        seriesIds,
      },
      type: QueryTypes.UPDATE,
    });
  }
}
