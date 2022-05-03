import { OrderEnum, PageOptionsDto } from '../../../../common/dto';

export class GetChildCommentsDto extends PageOptionsDto {
  public parentId: number;
  public authUserId: number;
  public childCommentId?: number = null;
  public offset?: number = 0;
  public limit?: number = 10;
  public order?: OrderEnum = OrderEnum.DESC;
}
