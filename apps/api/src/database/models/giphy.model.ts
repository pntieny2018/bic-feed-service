import { Column, Model, PrimaryKey, Table } from 'sequelize-typescript';

export enum GiphyType {
  GIF = 'gif',
  STICKER = 'sticker',
}

export interface IGiphy {
  id: string;
  type: GiphyType;
}

@Table({
  tableName: 'giphy',
  timestamps: false,
})
export class GiphyModel extends Model implements IGiphy {
  @PrimaryKey
  @Column
  public id: string;

  @PrimaryKey
  @Column
  public type: GiphyType;
}
