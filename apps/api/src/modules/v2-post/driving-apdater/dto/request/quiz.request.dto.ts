import { CONTENT_TYPE, ORDER, QUIZ_STATUS } from '@beincom/constants';
import { PaginatedArgs } from '@libs/database/postgres/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

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

export class QuizAnswerRequestDto {
  @ApiProperty()
  @IsNotEmpty()
  public id: string;

  @ApiProperty()
  @IsNotEmpty()
  @MaxLength(255)
  public content: string;

  @ApiProperty()
  @IsNotEmpty()
  @Type(() => Boolean)
  @Expose({
    name: 'is_correct',
  })
  public isCorrect: boolean;
  public constructor(data: QuizAnswerRequestDto) {
    Object.assign(this, data);
  }
}

export class QuizQuestionRequestDto {
  @ApiProperty()
  @IsNotEmpty()
  public id: string;

  @ApiProperty()
  @IsNotEmpty()
  @MaxLength(255)
  public content: string;

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

  @ApiProperty({ enum: QUIZ_STATUS, required: false })
  @IsOptional()
  @IsEnum(QUIZ_STATUS)
  public status?: QUIZ_STATUS;

  @ApiProperty({ enum: ORDER, default: ORDER.DESC, required: false })
  @IsEnum(ORDER)
  @IsOptional()
  public order?: ORDER = ORDER.DESC;

  public constructor(data: UpdateQuizRequestDto) {
    Object.assign(this, data);
  }
}

class AnswerUser {
  @ApiProperty({ type: String })
  @IsUUID()
  @IsOptional()
  public id?: string;

  @ApiProperty({ type: String })
  @IsUUID()
  @IsNotEmpty()
  @Expose({ name: 'question_id' })
  public questionId: string;

  @ApiProperty({ type: String })
  @IsUUID()
  @IsNotEmpty()
  @Expose({ name: 'answer_id' })
  public answerId: string;
}

export class UpdateQuizAnswersRequestDto {
  @ApiProperty({ type: Boolean })
  @IsOptional()
  @Expose({
    name: 'is_finished',
  })
  @IsBoolean()
  public isFinished?: boolean;

  @ApiProperty({ type: String })
  @ValidateNested({ each: true })
  @IsNotEmpty()
  @Type(() => AnswerUser)
  public answers: AnswerUser[];

  public constructor(data: UpdateQuizAnswersRequestDto) {
    Object.assign(this, data);
  }
}

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

export class GetQuizzesRequestDto extends PaginatedArgs {
  @ApiProperty({ enum: ORDER, default: ORDER.DESC, required: false })
  @IsEnum(ORDER)
  public order: ORDER = ORDER.DESC;

  @ApiProperty({
    description: 'Quizz status',
    required: true,
    enum: QUIZ_STATUS,
  })
  @Expose({
    name: 'status',
  })
  @IsEnum(QUIZ_STATUS)
  public status: QUIZ_STATUS;

  @ApiPropertyOptional({
    description: 'Content type',
    required: false,
    enum: CONTENT_TYPE,
  })
  @Expose({
    name: 'type',
  })
  @IsOptional()
  @IsEnum(CONTENT_TYPE)
  @ValidateIf((i) => i.type !== '')
  public type?: CONTENT_TYPE;
}

class AddQuizAnswerRequestDto {
  @ApiProperty()
  @IsNotEmpty()
  @MaxLength(255)
  public content: string;

  @ApiProperty()
  @IsNotEmpty()
  @Expose({
    name: 'is_correct',
  })
  @Type(() => Boolean)
  public isCorrect: boolean;
  public constructor(data: AddQuizAnswerRequestDto) {
    Object.assign(this, data);
  }
}
export class AddQuizQuestionRequestDto {
  @ApiProperty()
  @IsNotEmpty()
  @MaxLength(255)
  public content: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddQuizAnswerRequestDto)
  public answers: AddQuizAnswerRequestDto[];

  public constructor(data: AddQuizQuestionRequestDto) {
    Object.assign(this, data);
  }
}

export class GetQuizParticipantsSummaryDetailRequestDto extends PaginatedArgs {
  @ApiProperty({ enum: ORDER, default: ORDER.DESC, required: false })
  @IsEnum(ORDER)
  public order: ORDER = ORDER.DESC;
}

class UpdateQuizAnswerRequestDto {
  @ApiProperty()
  @IsOptional()
  @IsUUID()
  public id?: string;

  @ApiProperty()
  @IsNotEmpty()
  @MaxLength(255)
  public content: string;

  @ApiProperty()
  @IsNotEmpty()
  @Type(() => Boolean)
  @Expose({
    name: 'is_correct',
  })
  public isCorrect: boolean;
  public constructor(data: UpdateQuizAnswerRequestDto) {
    Object.assign(this, data);
  }
}
export class UpdateQuizQuestionRequestDto {
  @ApiProperty()
  @IsNotEmpty()
  @MaxLength(255)
  public content: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateQuizAnswerRequestDto)
  public answers: UpdateQuizAnswerRequestDto[];

  public constructor(data: UpdateQuizQuestionRequestDto) {
    Object.assign(this, data);
  }
}
