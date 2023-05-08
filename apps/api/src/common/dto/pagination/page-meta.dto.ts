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
  public total?: number;

  @ApiProperty({ name: 'has_previous_page' })
  public hasPreviousPage?: boolean;

  @ApiProperty({ name: 'has_next_page' })
  public hasNextPage?: boolean;

  public constructor({ pageOptionsDto, total }: IPageMeta) {
    if (pageOptionsDto.offset) {
      this.offset = pageOptionsDto.offset;
    }
    this.limit = pageOptionsDto.limit;
    this.total = total;
    this.hasPreviousPage = this.offset > 0 && this.total > 1;
    this.hasNextPage = Number(this.offset) + Number(this.limit) < this.total;
  }
}
