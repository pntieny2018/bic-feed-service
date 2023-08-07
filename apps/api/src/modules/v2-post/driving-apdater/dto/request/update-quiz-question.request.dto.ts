import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Expose, Type } from 'class-transformer';

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
