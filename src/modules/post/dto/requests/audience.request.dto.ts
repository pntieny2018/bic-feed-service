import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsNotEmpty, IsOptional, ValidateNested } from 'class-validator';
import { UserSharedDto } from '../../../../shared/user/dto';
import { GroupSharedDto } from '../../../../shared/group/dto/group-shared.dto';

export class AudienceRequestDto {
  @ApiProperty({
    default: [],
    type: Number,
    required: false,
    isArray: true,
    description: 'Array of user',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  public userIds?: number[] = [];

  @ApiProperty({
    type: Number,
    isArray: true,
    description: 'Array of group',
  })
  @ValidateNested({ each: true })
  @IsNotEmpty()
  @ArrayNotEmpty()
  public groupIds: number[];
}
