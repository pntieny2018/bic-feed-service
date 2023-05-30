import { Expose } from 'class-transformer';

export class CreateFastlaneDto {
  @Expose({
    name: 'group_ids',
  })
  public groupIds: any[];

  public content: string;

  @Expose({
    name: 'mention_user_ids',
  })
  public mentionUserIds: any[];
}
