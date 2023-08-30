import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, MaxLength, ValidateNested } from 'class-validator';
import { Expose, Type } from 'class-transformer';

class AddQuizAnswerRequestDto {
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
