import { PageOptionsDto } from '../../../../common/dto';
import { ApiProperty } from '@nestjs/swagger';
import { PostStatus } from '../../../../database/models/post.model';
import { Transform } from 'class-transformer';
import { PostHelper } from '../../post.helper';
import { IsNotEmpty } from 'class-validator';
import { PostStatusConflictedException } from '../../../v2-post/domain/exception';

export class GetPostsByParamsDto extends PageOptionsDto {
  @ApiProperty({
    enum: [PostStatus],
  })
  @IsNotEmpty()
  @Transform(({ value }) => {
    const status = value.split(',').filter((v) => Object.values(PostStatus).includes(v));
    if (PostHelper.isConflictStatus(status)) {
      throw new PostStatusConflictedException();
    }
    return status;
  })
  public status: PostStatus[];
}
