import { ApiProperty } from '@nestjs/swagger';
import { UserMentionDto } from '../../../mention/dto';
import { Expose, plainToInstance, Transform, Type } from 'class-transformer';
import { MediaResponseDto } from '../../../media/dto/response';
import { UserDataShareDto } from '../../../../shared/user/dto';

export class CommentResponseDto {
  @ApiProperty()
  @Expose()
  public id: number;

  @ApiProperty()
  @Expose()
  public actor: UserDataShareDto;

  @ApiProperty()
  @Expose()
  public parentId?: number;

  @ApiProperty()
  @Expose()
  public postId: number;

  @ApiProperty()
  @Expose()
  public content?: string;

  @ApiProperty()
  @Expose()
  public createdAt?: Date;

  @ApiProperty()
  @Expose()
  public updatedAt?: Date;

  @ApiProperty({
    type: [MediaResponseDto],
  })
  @Expose()
  public media?: MediaResponseDto[];

  @ApiProperty({
    type: 'object',
    additionalProperties: {
      type: 'object',
    },
  })
  @Transform(({ value }) => {
    if (value && value !== '1=') {
      const rawReactionsCount: string = (value as string).substring(1);
      const [s1, s2] = rawReactionsCount.split('=');
      const reactionsName = s1.split(',');
      const total = s2.split(',');
      const reactionsCount = {};
      reactionsName.forEach((v, i) => (reactionsCount[i] = { [v]: parseInt(total[i]) }));
      return reactionsCount;
    }
    return null;
  })
  @Expose()
  public reactionsCount?: Record<string, Record<string, number>>;

  @ApiProperty({
    type: UserMentionDto,
    additionalProperties: {
      type: 'object',
    },
  })
  @Expose()
  public mentions?: UserMentionDto;

  @ApiProperty({
    type: [CommentResponseDto],
  })
  @Type(() => CommentResponseDto)
  @Transform(({ value }) => plainToInstance(CommentResponseDto, value))
  @Expose()
  public child?: CommentResponseDto[];
}
