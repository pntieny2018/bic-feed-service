import { ApiHeader } from '@nestjs/swagger';
import { VERSION_HEADER_KEY } from '../constants';

@ApiHeader({
  name: VERSION_HEADER_KEY,
  description: 'Api Version',
  schema: {
    default: '1',
    enum: ['1', '2'],
  },
})
export class VersionController {}
