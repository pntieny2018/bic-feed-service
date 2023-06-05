import { SeriesMessagePayload } from './series.message-payload';

export class SeriesChangedMessagePayload {
  public state: 'publish' | 'update' | 'delete';
  public before?: SeriesMessagePayload;
  public after: SeriesMessagePayload & {
    state: {
      attachGroupIds: string[];
      detachGroupIds: string[];
    };
  };

  public constructor(data: Partial<SeriesChangedMessagePayload>) {
    Object.assign(this, data);
  }
}
