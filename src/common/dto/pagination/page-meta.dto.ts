import { ApiProperty } from '@nestjs/swagger';
import { IPageMeta } from './page-meta.interface';
import { IsOptional } from 'class-validator';

export class PageMetaDto {
  @ApiProperty()
  @IsOptional()
  public offset?: number;

  @ApiProperty()
  public limit: number;

  @ApiProperty()
  public total: number;

  @ApiProperty()
  public hasPreviousPage?: boolean;

  @ApiProperty()
  public hasNextPage?: boolean;

  public constructor({ pageOptionsDto, total }: IPageMeta) {
    if (pageOptionsDto.offset) {
      this.offset = pageOptionsDto.offset;
    }
    this.limit = pageOptionsDto.limit;
    this.total = total;
    this.hasPreviousPage = this.offset > 1 && this.total > 1;
    this.hasNextPage = this.offset < this.total;
  }
}
