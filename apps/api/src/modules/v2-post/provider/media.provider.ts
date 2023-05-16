import { MEDIA_REPOSITORY_TOKEN } from '../domain/repositoty-interface/media.repository.interface';
import { MediaRepository } from '../driven-adapter/repository/media.repository';

export const mediaProvider = [
  {
    provide: MEDIA_REPOSITORY_TOKEN,
    useClass: MediaRepository,
  },
];
