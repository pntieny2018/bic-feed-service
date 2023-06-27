import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID, MaxLength, MinLength } from 'class-validator';
import { Expose, Type } from 'class-transformer';

export class CreateQuizRequestDto {
  @ApiProperty({ type: Number })
  @Type(() => Number)
  @MinLength(1)
  @MaxLength(6)
  @Expose({
    name: 'number_of_questions_display',
  })
  public numberOfQuestionsDisplay: number;

  @ApiProperty({ type: Number })
  @Type(() => Number)
  @MinLength(1)
  @MaxLength(6)
  @Expose({
    name: 'number_of_answers_display',
  })
  public numberOfAnswersDisplay: number;

  @ApiProperty({ type: Boolean })
  @Type(() => Boolean)
  @Expose({
    name: 'is_random',
  })
  public isRandom: boolean;

  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsUUID()
  @Expose({
    name: 'content_id',
  })
  public contentId: string;

  public constructor(data: CreateQuizRequestDto) {
    Object.assign(this, data);
  }
}
