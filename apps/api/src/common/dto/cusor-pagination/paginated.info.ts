import { ApiProperty } from '@nestjs/swagger';
import { IPaginatedInfo } from './paginated.interface';
import { IsOptional } from 'class-validator';

export class PaginatedInfo implements IPaginatedInfo {
  @ApiProperty()
  @IsOptional()
  public previousCursor?: string;

  @ApiProperty()
  @IsOptional()
  public nextCursor?: string;

  @ApiProperty()
  @IsOptional()
  public hasPreviousPage?: boolean = false;

  @ApiProperty()
  @IsOptional()
  public hasNextPage?: boolean = false;
}
