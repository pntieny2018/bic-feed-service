import { ApiPropertyOptional } from '@nestjs/swagger';
import { IPaginatedInfo } from './paginated.interface';
import { IsOptional } from 'class-validator';

export class PaginatedInfo implements IPaginatedInfo {
  @IsOptional()
  @ApiPropertyOptional()
  public total?: number;

  @ApiPropertyOptional()
  @IsOptional()
  public startCursor?: string;

  @ApiPropertyOptional()
  @IsOptional()
  public endCursor?: string;

  @ApiPropertyOptional()
  @IsOptional()
  public hasPreviousPage?: boolean = false;

  @ApiPropertyOptional()
  @IsOptional()
  public hasNextPage?: boolean = false;
}
