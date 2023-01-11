import { PageOptionsDto } from '../../../../common/dto';
import { ApiProperty } from '@nestjs/swagger';
import { PostStatus } from '../../../../database/models/post.model';

export class GetPostsByParamsDto extends PageOptionsDto {
  @ApiProperty({
    enum: [PostStatus],
  })
  public status: PostStatus[];
}
