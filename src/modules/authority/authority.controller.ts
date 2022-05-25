//import { AuthUser, UserInfoDto } from '../auth';
import { ApiTags, ApiSecurity, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { Controller, Get} from '@nestjs/common';
import { AuthUser, UserDto } from '../auth';
import { APP_VERSION } from '../../common/constants';

@ApiSecurity('authorization')
@ApiTags('Recent Searches')
@Controller({
  path: 'authorization',
  version: APP_VERSION,
})
export class AuthorityController {
  @ApiOperation({ summary: 'Get Giphy API key' })
  @ApiOkResponse({
    type: String,
  })
  @Get('/giphy-key')
  public getGiphyKey(@AuthUser() user: UserDto): string {
    return process.env.GIPHY_API_KEY;
  }
}
