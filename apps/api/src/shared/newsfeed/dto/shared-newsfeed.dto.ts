import { PostModel } from '../../../database/models/post.model';

export class SharedNewsfeedDto {
  public lastGenerated: Date;
  public data: PostModel[];
}
