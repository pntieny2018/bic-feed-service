import { MEDIA_VALIDATOR_TOKEN } from '../domain/validator/interface/media.validator.interface';
import { MediaValidator } from '../domain/validator/media.validator';

export const sharedProvider = [
  {
    provide: MEDIA_VALIDATOR_TOKEN,
    useClass: MediaValidator,
  },
];
