import { DataTypes, InferAttributes, InferCreationAttributes } from 'sequelize';
import { Column, Model, PrimaryKey, Table } from 'sequelize-typescript';

export enum GiphyType {
  GIF = 'gif',
  STICKER = 'sticker',
}

export type GiphyAttributes = InferAttributes<GiphyModel>;

@Table({
  tableName: 'giphy',
  timestamps: false,
})
export class GiphyModel extends Model<GiphyAttributes, InferCreationAttributes<GiphyModel>> {
  @PrimaryKey
  @Column
  public id: string;

  @PrimaryKey
  @Column({
    type: DataTypes.STRING,
  })
  public type: GiphyType;
}
