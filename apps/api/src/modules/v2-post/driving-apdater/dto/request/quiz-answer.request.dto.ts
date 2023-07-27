import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, MaxLength } from 'class-validator';
import { Expose, Type } from 'class-transformer';

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
