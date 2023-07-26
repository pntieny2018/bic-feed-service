import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, Max, Min } from 'class-validator';
import { Expose, Type } from 'class-transformer';

export class GenerateQuizRequestDto {
  @ApiProperty({ type: Number })
  @Type(() => Number)
  @Min(1)
  @Max(50)
  @Expose({
    name: 'number_of_questions',
  })
  @IsOptional()
  public numberOfQuestions?: number;

  @ApiProperty({ type: Number })
  @Type(() => Number)
  @Min(1)
  @Max(6)
  @IsOptional()
  @Expose({
    name: 'number_of_answers',
  })
  public numberOfAnswers?: number;

  public constructor(data: GenerateQuizRequestDto) {
    Object.assign(this, data);
  }
}
