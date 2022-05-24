import { ApiProperty } from '@nestjs/swagger';
import { UserMentionDto } from '../../../mention/dto';
import { Expose, plainToInstance, Transform, Type } from 'class-transformer';
import { MediaFilterResponseDto } from '../../../media/dto/response';
import { UserDataShareDto } from '../../../../shared/user/dto';
import { ReactionResponseDto } from '../../../reaction/dto/response';
import { MediaService } from '../../../media';
import { CommentResponseDto } from '.';
import { PageDto } from '../../../../common/dto';

export class CommentDetailResponseDto {
  @ApiProperty({ type: CommentResponseDto })
  @Expose()
  public comment: CommentResponseDto;

  @ApiProperty({ type: UserDataShareDto })
  @Expose()
  public actor: UserDataShareDto;

  @ApiProperty({
    example: {
      list: [
        {
          ['total_reply']: 0,
          ['owner_reactions']: [
            {
              id: 8,
              ['reaction_name']: 'cccc',
              ['created_at']: '2022-05-03T11:21:52.451Z',
            },
          ],
          id: 161,
          actor: {
            id: 10,
            username: 'thienna',
            fullname: 'Nguyễn Anh Thiện',
            avatar:
              'https://s3.amazonaws.com/hrpartner/3hHQzQLEwIQgJ43broUzUA/employee/57423/Anh%20Thi%E1%BB%87n.jpg',
          },
          ['parent_id']: 50002,
          ['post_id']: 1001,
          content: 'comment aaaa.....',
          ['created_at']: '2022-04-28T09:41:21.169Z',
          ['updated_at']: null,
          media: {
            videos: [],
            images: [],
            files: [],
          },
          ['reactions_count']: {
            ['0']: {
              smile: 1,
            },
          },
          mentions: [],
        },
      ],
      meta: {
        limit: 5,
        offset: 0,
        ['has_next_page']: false,
        ['has_previous_page']: false,
      },
    },
  })
  @Expose()
  public child: PageDto<CommentResponseDto>;

  public constructor(data: Partial<CommentResponseDto>) {
    Object.assign(this, data);
  }
}
