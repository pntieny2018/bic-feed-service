import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { Expose } from 'class-transformer';

export class GetUserSeenPostDto {
  @ApiProperty({
    name: 'post_id',
  })
  @IsNotEmpty()
  @IsUUID()
  @Expose({
    name: 'post_id',
  })
  public postId: string;

  @ApiProperty({
    default: 20,
    required: false,
  })
  @IsOptional()
  public limit: number;

  @ApiProperty({
    default: 0,
    required: false,
  })
  @IsOptional()
  public offset: number;
}
