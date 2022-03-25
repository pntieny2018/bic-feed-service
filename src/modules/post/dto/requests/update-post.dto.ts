import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreatePostDto } from '.';
export class UpdatePostDto extends CreatePostDto {
  @ApiProperty({
    description: 'To know draft post or not',
    type: Boolean,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  public isDraft = false;
}
