import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderEnum, PaginatedArgs } from '../../../../../common/dto';
import { IsEnum, IsOptional, ValidateIf } from 'class-validator';
import { PostType, QuizStatus } from '../../../data-type';
import { Expose } from 'class-transformer';

export class GetQuizzesRequestDto extends PaginatedArgs {
  @ApiProperty({ enum: OrderEnum, default: OrderEnum.DESC, required: false })
  @IsEnum(OrderEnum)
  public order: OrderEnum = OrderEnum.DESC;

  @ApiProperty({
    description: 'Quizz status',
    required: true,
    enum: QuizStatus,
  })
  @Expose({
    name: 'status',
  })
  @IsEnum(QuizStatus)
  public status: QuizStatus;

  @ApiPropertyOptional({
    description: 'Content type',
    required: false,
    enum: PostType,
  })
  @Expose({
    name: 'type',
  })
  @IsOptional()
  @IsEnum(PostType)
  @ValidateIf((i) => i.type !== '')
  public type?: PostType;
}
