import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, ValidateNested } from 'class-validator';
import { Expose, Type } from 'class-transformer';
import { AnswerUserDto } from '../../../application/dto/quiz-participant.dto';

export class UpdateQuizAnswersRequestDto {
  @ApiProperty({ type: Date })
  @IsOptional()
  @Expose({
    name: 'is_finished',
  })
  @IsBoolean()
  public isFinished?: boolean;

  @ApiProperty({ type: String })
  @ValidateNested({ each: true })
  @IsNotEmpty()
  @Type(() => AnswerUserDto)
  public answers: AnswerUserDto[];

  public constructor(data: UpdateQuizAnswersRequestDto) {
    Object.assign(this, data);
  }
}
