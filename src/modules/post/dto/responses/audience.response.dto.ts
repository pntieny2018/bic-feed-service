import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsNotEmpty, IsOptional, ValidateNested } from 'class-validator';
import { UserSharedDto } from '../../../../shared/user/dto';
import { GroupSharedDto } from '../../../../shared/group/dto/group-shared.dto';

export class AudienceResponseDto {
  @ApiProperty({
    default: [],
    type: UserSharedDto,
    required: false,
    isArray: true,
    description: 'Array of user',
  })
  @IsOptional()
  @IsArray()
  @Type(() => UserSharedDto)
  @ValidateNested({ each: true })
  public users?: UserSharedDto[] = [];

  @ApiProperty({
    type: GroupSharedDto,
    isArray: true,
    description: 'Array of group',
  })
  @ValidateNested({ each: true })
  @IsNotEmpty()
  @ArrayNotEmpty()
  @Type(() => GroupSharedDto)
  public groups: GroupSharedDto[];
}
