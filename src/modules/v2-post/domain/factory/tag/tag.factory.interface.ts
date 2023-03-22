import { TagEntity, TagProps } from '../../model/tag';

export type CreateTagProps = Readonly<{
  name: string;
  groupId: string;
  userId: string;
}>;
export interface ITagFactory {
  create(props: CreateTagProps): TagEntity;

  reconstitute(props: TagProps): TagEntity;
}
export const TAG_FACTORY_TOKEN = 'TAG_FACTORY_TOKEN';
