import { PageOptionsDto } from '../../../../common/dto';
import { ApiProperty } from '@nestjs/swagger';
import { PostStatus } from '../../../../database/models/post.model';
import { Transform } from 'class-transformer';
import { PostHelper } from '../../post.helper';
import { ExceptionHelper } from '../../../../common/helpers';
import { HTTP_STATUS_ID } from '../../../../common/constants';
import { IsNotEmpty } from 'class-validator';

export class GetPostsByParamsDto extends PageOptionsDto {
  @ApiProperty({
    enum: [PostStatus],
  })
  @IsNotEmpty()
  @Transform(({ value }) => {
    const status = value.split(',').filter((v) => Object.values(PostStatus).includes(v));
    if (PostHelper.isConflictStatus(status)) {
      ExceptionHelper.throwBadRequestException(HTTP_STATUS_ID.APP_POST_STATUS_CONFLICTED);
    }
    return status;
  })
  public status: PostStatus[];
}
