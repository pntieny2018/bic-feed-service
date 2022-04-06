import { MediaDto } from '../../../media/dto/media.dto';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ValidateNested } from 'class-validator';
import { UserDataShareDto } from '../../../../shared/user/dto';

export class UpdateCommentDto {
  @ApiProperty({ type: String })
  @Type(() => String)
  public content: string;

  @ApiProperty({ type: MediaDto })
  @ValidateNested()
  @Type(() => MediaDto)
  public media?: MediaDto = { files: [], images: [], videos: [] };

  @ApiProperty({ type: [UserDataShareDto] })
  public mentions?: UserDataShareDto[] = [];
}
