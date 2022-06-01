import { IsUUID } from 'class-validator';
import {BelongsTo, Column, CreatedAt, ForeignKey, Model, PrimaryKey, Table, UpdatedAt} from 'sequelize-typescript';
import { SeriesModel } from './series.model';
import { PostModel } from './post.model';

export interface IPostSeries {
  postId: string;
  seriesId: string;
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

  @ForeignKey(() => SeriesModel)
  @PrimaryKey
  @IsUUID()
  @Column
  public seriesId: string;

  @BelongsTo(() => PostModel)
  public post?: PostModel;

  @BelongsTo(() => SeriesModel)
  public series?: SeriesModel;

  @CreatedAt
  @Column
  public createdAt?: Date;

  @UpdatedAt
  @Column
  public updatedAt?: Date;
}
