import { ORDER } from '@beincom/constants';
import { PaginatedArgs } from '@libs/database/postgres/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  Max,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { NIL } from 'uuid';

import { PAGING_DEFAULT_LIMIT } from '../../../../../common/constants';
import { GiphyDto } from '../../../../v2-giphy/driving-adapter/dto/giphy.dto';
import { UserMentionDto } from '../../../application/dto';

import { MediaRequestDto } from './media.request.dto';
import { MaxMarkdownLength } from '@api/modules/v2-post/driving-apdater/custom-validation/MaxMarkdownLength.validation';
import { RULES } from '@api/modules/v2-post/constant';

export class CreateCommentRequestDto {
  @ApiProperty({
    type: String,
    example: '40dc4093-1bd0-4105-869f-8504e1986145',
    name: 'post_id',
  })
  @IsNotEmpty()
  @IsUUID()
  @Expose({
    name: 'post_id',
  })
  public postId: string;

  @ApiProperty({ type: String })
  @Type(() => String)
  @IsNotEmpty()
  @ValidateIf(
    (o) =>
      !(
        o.media?.images?.length > 0 ||
        o.media?.videos?.length > 0 ||
        o.media?.files?.length > 0 ||
        o.giphyId
      )
  )
  @MaxMarkdownLength(RULES.MAX_COMMENT_CHARACTER, {
    message: `Your comment cannot exceed ${new Intl.NumberFormat('de-ES').format(
      RULES.MAX_COMMENT_CHARACTER
    )} characters. `,
  })
  public content: string;

  @ApiProperty({
    description: 'Post data, includes content, images, files, videos',
    type: MediaRequestDto,
    required: false,
    example: {
      images: [
        {
          id: 1,
          url: 'https://www.beincom.io/file',
          name: 'File name 1',
        },
      ],
      videos: [],
      files: [],
    },
  })
  @IsNotEmpty()
  @ValidateIf((o) => o.content === null || o.content == undefined)
  @ValidateNested({ each: true })
  @Type(() => MediaRequestDto)
  public media?: MediaRequestDto = { files: [], images: [], videos: [] };

  @ApiPropertyOptional({
    type: UserMentionDto,
    example: {
      beincom: {
        id: '26799d29-189b-435d-b618-30fb70e9b09e',
        username: 'beincom',
        fullname: 'Beincom EVOL',
      },
    },
  })
  @IsOptional()
  @Type(() => UserMentionDto)
  @Transform(({ value }) => {
    if (typeof value === 'object') {
      const mentionUserIds = [];
      for (const property in value) {
        if (value[property]?.id) {
          mentionUserIds.push(value[property].id);
        }
      }
      return mentionUserIds;
    }
    return value;
  })
  public mentions?: string[];

  @ApiProperty({
    type: GiphyDto,
    name: 'giphy',
    example: {
      id: '3pZipqyo1sqHDfJGtz',
      type: 'gif',
      url: 'https://i.giphy.com/3pZipqyo1sqHDfJGtz',
    },
  })
  @IsNotEmpty()
  @Type(() => GiphyDto)
  @Expose({
    name: 'giphy',
  })
  @ValidateIf(
    (o) =>
      !(
        o.content ||
        o.media?.images?.length > 0 ||
        o.media?.videos?.length > 0 ||
        o.media?.files?.length > 0
      )
  )
  @Transform(({ value }) => {
    if (typeof value === 'object') {
      if (value?.id) {
        return value.id;
      }
    }
    return '';
  })
  public giphyId?: string;
}

export class GetCommentsAroundIdDto {
  @ApiPropertyOptional({
    required: false,
    default: 10,
  })
  @IsOptional()
  @Min(1)
  @Max(PAGING_DEFAULT_LIMIT)
  @Type(() => Number)
  public limit?: number = 10;

  @ApiPropertyOptional({
    required: false,
    default: 10,
    name: 'target_child_limit',
  })
  @IsOptional()
  @Min(1)
  @Max(PAGING_DEFAULT_LIMIT)
  @Type(() => Number)
  @Expose({
    name: 'target_child_limit',
  })
  public targetChildLimit?: number;
}

export class GetListCommentsDto extends PaginatedArgs {
  @ApiProperty({ enum: ORDER, default: ORDER.DESC, required: false })
  @IsEnum(ORDER)
  public order: ORDER = ORDER.DESC;

  @ApiProperty({
    required: true,
    name: 'post_id',
  })
  @IsUUID()
  @IsNotEmpty()
  @Expose({
    name: 'post_id',
  })
  public postId: string;

  @ApiPropertyOptional({
    required: false,
    name: 'parent_id',
  })
  @IsUUID()
  @IsOptional()
  @Expose({
    name: 'parent_id',
  })
  public parentId: string = NIL;
}

export class ReplyCommentRequestDto extends CreateCommentRequestDto {}

export class UpdateCommentRequestDto {
  @ApiPropertyOptional()
  @Type(() => String)
  @IsOptional()
  @MaxMarkdownLength(RULES.MAX_COMMENT_CHARACTER, {
    message: `Your comment cannot exceed ${new Intl.NumberFormat('de-ES').format(
      RULES.MAX_COMMENT_CHARACTER
    )} characters. `,
  })
  public content: string;

  @ApiPropertyOptional({
    description: 'Post data, includes content, images, files, videos',
    type: MediaRequestDto,
    required: false,
    example: {
      images: [
        {
          id: 1,
          url: 'https://www.beincom.io/file',
          name: 'File name 1',
        },
      ],
      videos: [],
      files: [],
    },
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => MediaRequestDto)
  public media?: MediaRequestDto;

  @ApiPropertyOptional({
    type: UserMentionDto,
    example: {
      beincom: {
        id: '26799d29-189b-435d-b618-30fb70e9b09e',
        username: 'beincom',
        fullname: 'Beincom EVOL',
      },
    },
  })
  @IsOptional()
  @Type(() => UserMentionDto)
  @Transform(({ value }) => {
    if (typeof value === 'object') {
      const mentionUserIds = [];
      for (const property in value) {
        if (value[property]?.id) {
          mentionUserIds.push(value[property].id);
        }
      }
      return mentionUserIds;
    }
    return value;
  })
  public mentions?: string[];

  @ApiPropertyOptional({
    type: GiphyDto,
    name: 'giphy',
    example: {
      id: '3pZipqyo1sqHDfJGtz',
      type: 'gif',
      url: 'https://i.giphy.com/3pZipqyo1sqHDfJGtz',
    },
  })
  @IsOptional()
  @Type(() => GiphyDto)
  @Expose({
    name: 'giphy',
    toPlainOnly: true,
  })
  @Transform(({ value }) => {
    if (typeof value === 'object') {
      if (value?.id) {
        return value.id;
      }
    }
    return '';
  })
  public giphyId?: string;
}

export class GetMyReportedCommentsRequestDto extends PaginatedArgs {
  @ApiProperty({ enum: ORDER, default: ORDER.DESC, required: false })
  @IsEnum(ORDER)
  public order: ORDER = ORDER.DESC;

  @ApiProperty({ name: 'target_ids', required: false, type: [String] })
  @Expose({ name: 'target_ids' })
  @Type(() => Array)
  @Transform(({ value }) => (typeof value === 'string' && !value.includes(',') ? [value] : value))
  public targetIds?: string[];
}
