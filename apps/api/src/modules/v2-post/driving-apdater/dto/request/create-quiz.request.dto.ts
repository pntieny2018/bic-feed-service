import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsUUID, Max, MaxLength, Min } from 'class-validator';
import { Expose, Transform, Type } from 'class-transformer';
import { BooleanHelper } from '@libs/common/helpers';

export class CreateQuizRequestDto {
  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsUUID()
  @Expose({
    name: 'content_id',
  })
  @Transform((data) => {
    if (!data.obj.content_id && data.obj.contentId) {
      return data.obj.contentId;
    }
    return data.obj.content_id;
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
  @Transform((data) => {
    if (!data.obj.number_of_questions && data.obj.numberOfQuestions) {
      return data.obj.numberOfQuestions;
    }
    return data.obj.number_of_questions;
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
  @Transform((data) => {
    if (!data.obj.number_of_answers && data.obj.numberOfQuestions) {
      return data.obj.numberOfAnswers;
    }
    return data.obj.number_of_answers;
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
  @Transform((data) => {
    if (!data.obj.number_of_questions_display && data.obj.numberOfQuestionsDisplay) {
      return data.obj.numberOfQuestionsDisplay;
    }
    return data.obj.number_of_questions_display;
  })
  public numberOfQuestionsDisplay?: number;

  @ApiProperty({ type: Boolean })
  @Type(() => Boolean)
  @IsOptional()
  @Expose({
    name: 'is_random',
  })
  @Transform((data) => {
    if (!data.obj.is_random && data.obj.isRandom) {
      return BooleanHelper.convertStringToBoolean(data.obj.isRandom);
    }
    return BooleanHelper.convertStringToBoolean(data.obj.is_random);
  })
  public isRandom?: boolean;

  public constructor(data: CreateQuizRequestDto) {
    Object.assign(this, data);
  }
}
