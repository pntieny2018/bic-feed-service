import { Controller } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { VERSIONS_SUPPORTED } from '../../common/constants';

@ApiTags('Comment')
@ApiSecurity('authorization')
@Controller({
  version: VERSIONS_SUPPORTED,
  path: 'comments',
})
export class CommentController {}
