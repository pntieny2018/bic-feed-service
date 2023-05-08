import { PostPrivacy } from '../../../../database/models/post.model';

export class UpdatePrivacyDto {
  public privacy: PostPrivacy;
  public groupId: string;
}
