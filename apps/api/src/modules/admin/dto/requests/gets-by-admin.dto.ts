import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { IsNotEmpty } from 'class-validator';
import { validate as isValidUUID } from 'uuid';
import { PostStatus } from '../../../../database/models/post.model';
import { PageOptionsDto } from '../../../../common/dto';
import { PostHelper } from '../../../post/post.helper';
import { PostStatusConflictedException } from '../../../v2-post/domain/exception';

export class GetsByAdminDto extends PageOptionsDto {
  @ApiProperty({
    type: String,
    name: 'group_ids',
    example: '9322c384-fd8e-4a13-80cd-1cbd1ef95ba8,986dcaf4-c1ea-4218-b6b4-e4fd95a3c28e',
  })
  @IsNotEmpty()
  @Transform(({ value }) => value.split(',').filter((v) => isValidUUID(v)))
  @Expose({
    name: 'group_ids',
  })
  public groupIds: string[];

  @ApiProperty({
    type: String,
    name: 'status',
    example: 'DRAFT,PUBLISHED',
  })
  @IsNotEmpty()
  @Transform(({ value }) => {
    const status = value.split(',').filter((v) => Object.values(PostStatus).includes(v));
    if (PostHelper.isConflictStatus(status)) {
      throw new PostStatusConflictedException();
    }
    return status;
  })
  @Expose({
    name: 'status',
  })
  public status?: PostStatus[];
}
