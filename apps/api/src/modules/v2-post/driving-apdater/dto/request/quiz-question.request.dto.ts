import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { QuizAnswerRequestDto } from './quiz-answer.request.dto';

export class QuizQuestionRequestDto {
  @ApiProperty()
  @IsNotEmpty()
  public id: string;

  @ApiProperty()
  @IsNotEmpty()
  @MaxLength(255)
  public question: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuizAnswerRequestDto)
  public answers: QuizAnswerRequestDto[];

  public constructor(data: QuizQuestionRequestDto) {
    Object.assign(this, data);
  }
}
