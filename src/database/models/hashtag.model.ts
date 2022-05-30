import { Column, CreatedAt, Default, Length, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { Optional } from 'sequelize';
import { IsUUID } from 'class-validator';
import { v4 as uuid_v4 } from 'uuid';

export interface IHashtag {
  id: string;
  name: string;
  createdAt?: Date;
}

@Table({
  tableName: 'hashtags',
  updatedAt: false,
})
export class HashtagModel extends Model<IHashtag, Optional<IHashtag, 'id'>> implements IHashtag {
  @PrimaryKey
  @IsUUID()
  @Default(() => uuid_v4())
  @Column
  public id: string;

  @Length({ max: 5000 })
  @Column
  public name: string;

  @CreatedAt
  @Column
  public createdAt?: Date;
}
