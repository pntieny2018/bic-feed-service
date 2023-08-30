import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

import { PaginatedResponse } from '../../../../../common/dto';
import { ReactionsCount } from '../../../../../common/types';
import { CommentDto, ReactionDto } from '../../../application/dto';

export class CommentResponseDto extends CommentDto {
  @ApiProperty({
    name: 'updated_at',
  })
  public updatedAt?: Date;

  @ApiProperty({
    type: [ReactionDto],
    name: 'owner_reactions',
  })
  @Expose()
  public ownerReactions?: ReactionDto[] = [];

  @ApiProperty({
    name: 'reactions_count',
  })
  @Expose()
  public reactionsCount?: ReactionsCount = [];

  @ApiProperty({
    name: 'child',
  })
  @Expose()
  public child?: PaginatedResponse<CommentResponseDto>;

  public constructor(data: Partial<CommentResponseDto>) {
    super(data);
    Object.assign(this, data);
  }
}
