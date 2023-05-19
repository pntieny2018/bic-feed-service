import { PostMessagePayload } from './post.message-payload';

export class PostPublishedMessagePayload {
  public isPublished: boolean;
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

  public constructor(data: Partial<PostPublishedMessagePayload>) {
    Object.assign(this, data);
  }
}
