import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Expose, Type } from 'class-transformer';

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
  @Type(() => AnswerUser)
  public answers: AnswerUser[];

  public constructor(data: UpdateQuizAnswersRequestDto) {
    Object.assign(this, data);
  }
}
