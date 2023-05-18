import { MEDIA_VALIDATOR_TOKEN } from '../domain/validator/interface/media.validator.interface';
import { MENTION_VALIDATOR_TOKEN } from '../domain/validator/interface/mention.validator.interface';
import { MediaValidator } from '../domain/validator/media.validator';
import { MentionValidator } from '../domain/validator/mention.validator';

export const sharedProvider = [
  {
    provide: MEDIA_VALIDATOR_TOKEN,
    useClass: MediaValidator,
  },
  {
    provide: MENTION_VALIDATOR_TOKEN,
    useClass: MentionValidator,
  },
];
