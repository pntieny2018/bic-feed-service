import { CreatedPostListener } from './created-post.listener';
import { PublishedPostListener } from './published-post.listener';
import { UpdatedPostListener } from './updated-post.listener';

export default [CreatedPostListener, UpdatedPostListener, PublishedPostListener];
