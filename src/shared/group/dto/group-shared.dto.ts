import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class GroupSharedDto {
  @ApiProperty({
    description: 'Group ID',
  })
  @IsNotEmpty()
  @IsNumber()
  public id: number;

  @ApiProperty({
    description: 'Group Name',
  })
  @IsOptional()
  public name: string;

  @ApiProperty({
    description: 'Group Icon',
  })
  @IsOptional()
  public icon: string;

  public child?: number[] = [];
}
