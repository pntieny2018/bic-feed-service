import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, Max, MaxLength, Min, ValidateNested } from 'class-validator';
import { Expose, Type } from 'class-transformer';
import { OrderEnum } from '../../../../../common/dto';
import { QuizStatus } from '../../../data-type/quiz.enum';
import { QuizQuestionRequestDto } from './quiz-question.request.dto';

export class UpdateQuizRequestDto {
  @ApiProperty({ type: String })
  @IsOptional()
  @MaxLength(64)
  public title?: string;

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
  @Expose({
    name: 'is_random',
  })
  @IsOptional()
  public isRandom?: boolean;

  @ApiProperty()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => QuizQuestionRequestDto)
  public questions?: QuizQuestionRequestDto[];

  @ApiProperty({ enum: QuizStatus, required: false })
  @IsOptional()
  @IsEnum(QuizStatus)
  public status?: QuizStatus;

  @ApiProperty({ enum: OrderEnum, default: OrderEnum.DESC, required: false })
  @IsEnum(OrderEnum)
  @IsOptional()
  public order?: OrderEnum = OrderEnum.DESC;

  public constructor(data: UpdateQuizRequestDto) {
    Object.assign(this, data);
  }
}
