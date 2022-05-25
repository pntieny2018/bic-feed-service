import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Controller } from '@nestjs/common';
import { APP_VERSION } from '../../common/constants';

@ApiTags('Category')
@ApiSecurity('authorization')
@Controller({
  version: APP_VERSION,
  path: 'category',
})
export class CategoryController {}
