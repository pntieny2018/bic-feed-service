import { PostMessagePayload } from './post.message-payload';

export class PostChangedMessagePayload {
  public state: 'publish' | 'update' | 'delete';
  public before: Omit<PostMessagePayload, 'tags' | 'media' | 'seriesIds' | 'communityIds'>;
  public after: PostMessagePayload & {
    state: {
      attachSeriesIds: string[];
      detachSeriesIds: string[];
      attachGroupIds: string[];
      detachGroupIds: string[];
      attachTagIds: string[];
      detachTagIds: string[];
      attachFileIds: string[];
      detachFileIds: string[];
      attachImageIds: string[];
      detachImageIds: string[];
      attachVideoIds: string[];
      detachVideoIds: string[];
    };
  };

  public constructor(data: Partial<PostChangedMessagePayload>) {
    Object.assign(this, data);
  }
}
