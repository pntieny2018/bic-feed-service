import { PageOptionsDto } from '../../../../common/dto';
import { ApiProperty } from '@nestjs/swagger';
import { PostStatus } from '../../../../database/models/post.model';
import { Transform } from 'class-transformer';
import { PostHelper } from '../../post.helper';
import { ExceptionHelper } from '../../../../common/helpers';
import { HTTP_STATUS_ID } from '../../../../common/constants';

export class GetPostsByParamsDto extends PageOptionsDto {
  @ApiProperty({
    enum: [PostStatus],
  })
  @Transform(({ value }) => {
    if (PostHelper.isConflictStatus(value)) {
      ExceptionHelper.throwBadRequestException(HTTP_STATUS_ID.APP_POST_STATUS_CONFLICTED);
    }
    return value;
  })
  public status: PostStatus[];
}
