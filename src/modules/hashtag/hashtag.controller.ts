import { ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Body, Controller, Get, Logger, Post, Query } from '@nestjs/common';
import { APP_VERSION } from '../../common/constants';
import { ResponseMessages } from '../../common/decorators';
import { HashtagResponseDto } from './dto/responses/hashtag-response.dto';
import { AuthUser } from '../auth';
import { CreateHashtagDto } from './dto/requests/create-hashtag.dto';
import { HashtagService } from './hashtag.service';
import { PageDto } from '../../common/dto';
import { GetHashtagDto } from './dto/requests/get-hashtag.dto';
import { UserDto } from '../v2-user/application';

@ApiTags('Hashtag')
@ApiSecurity('authorization')
@Controller({
  version: APP_VERSION,
  path: 'hashtag',
})
export class HashtagController {
  public constructor(private _hashtagService: HashtagService) {}
  private _logger = new Logger(HashtagController.name);
  @ApiOperation({ summary: 'Get categories' })
  @ApiOkResponse({
    type: HashtagResponseDto,
    description: 'Get hashtag successfully',
  })
  @ResponseMessages({
    success: 'Get hashtag successfully',
  })
  @Get('/')
  public async get(
    @AuthUser() _user: UserDto,
    @Query() getHashtagDto: GetHashtagDto
  ): Promise<PageDto<HashtagResponseDto>> {
    return this._hashtagService.get(getHashtagDto);
  }

  @ApiOperation({ summary: 'Create new hashtag' })
  @ApiOkResponse({
    type: HashtagResponseDto,
    description: 'Create hashtag successfully',
  })
  @ResponseMessages({
    success: 'Create hashtag successfully',
  })
  @Post('/')
  public async create(
    @AuthUser() _user: UserDto,
    @Body() createHashtagDto: CreateHashtagDto
  ): Promise<HashtagResponseDto> {
    return this._hashtagService.create(createHashtagDto.name);
  }
}
