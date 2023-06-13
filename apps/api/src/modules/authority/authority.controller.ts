//import { AuthUser, UserInfoDto } from '../auth';
import { ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Controller, Get } from '@nestjs/common';
import { VERSIONS_SUPPORTED } from '../../common/constants';

@ApiSecurity('authorization')
@ApiTags('Authorization')
@Controller({
  path: 'authorization',
  version: VERSIONS_SUPPORTED,
})
export class AuthorityController {
  @ApiOperation({ summary: 'Get Giphy API key' })
  @ApiOkResponse({
    type: String,
  })
  @Get('/giphy-key')
  public getGiphyKey(): string {
    return process.env.GIPHY_API_KEY;
  }
}
