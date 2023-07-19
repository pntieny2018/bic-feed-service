import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsUUID, Max, MaxLength, Min } from 'class-validator';
import { Expose, Type } from 'class-transformer';

export class CreateQuizRequestDto {
  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsUUID()
  @Expose({
    name: 'content_id',
  })
  public contentId: string;

  @ApiProperty({ type: String })
  @IsOptional()
  @MaxLength(64)
  public title: string;

  @ApiProperty({ type: String })
  @IsOptional()
  @MaxLength(255)
  public description?: string;

  @ApiProperty({ type: Number })
  @Type(() => Number)
  @Min(1)
  @Max(50)
  @Expose({
    name: 'number_of_questions',
  })
  @IsNotEmpty()
  public numberOfQuestions: number;

  @ApiProperty({ type: Number })
  @Type(() => Number)
  @Min(1)
  @Max(6)
  @IsNotEmpty()
  @Expose({
    name: 'number_of_answers',
  })
  public numberOfAnswers: number;

  @ApiProperty({ type: Number })
  @Type(() => Number)
  @Min(1)
  @Max(50)
  @IsOptional()
  @Expose({
    name: 'number_of_questions_display',
  })
  public numberOfQuestionsDisplay?: number;

  @ApiProperty({ type: Number })
  @Type(() => Number)
  @Min(1)
  @Max(6)
  @IsOptional()
  @Expose({
    name: 'number_of_answers_display',
  })
  public numberOfAnswersDisplay?: number;

  @ApiProperty({ type: Boolean })
  @Type(() => Boolean)
  @IsOptional()
  @Expose({
    name: 'is_random',
  })
  public isRandom?: boolean;

  public constructor(data: CreateQuizRequestDto) {
    Object.assign(this, data);
  }
}
