import { MediaDto } from '../../../media/dto';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { UserDataShareDto } from '../../../../shared/user/dto';

export class CreateCommentDto {
  @ApiProperty({
    type: Number,
  })
  @IsNotEmpty()
  @IsNumber()
  public postId: number;

  @ApiProperty({ type: String })
  @Type(() => String)
  @IsNotEmpty()
  public content: string;

  @ApiProperty({ type: MediaDto })
  @ValidateNested()
  @Type(() => MediaDto)
  @IsOptional()
  public media?: MediaDto = { files: [], images: [], videos: [] };

  @ApiProperty({ type: [UserDataShareDto], required: false })
  @Type(() => UserDataShareDto)
  public mentions?: UserDataShareDto[] = [];
}
