import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Version,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam, ApiSecurity, ApiTags } from '@nestjs/swagger';

import { VERSIONS_SUPPORTED } from '../../common/constants';
import { AuthUser, ResponseMessages } from '../../common/decorators';
import { PageDto } from '../../common/dto';
import { ArticleResponseDto } from '../article/dto/responses';
import { PinContentDto } from '../feed/dto/request/pin-content.dto';
import { UserDto } from '../v2-user/application';

import { PostAppService } from './application/post.app-service';
import { GetAudienceContentDto } from './dto/requests/get-audience-content.response.dto';
import { GetDraftPostDto } from './dto/requests/get-draft-posts.dto';
import { PostResponseDto } from './dto/responses';

@ApiSecurity('authorization')
@ApiTags('Content')
@Controller({
  version: VERSIONS_SUPPORTED,
  path: ['content', 'contents'],
})
export class ContentController {
  public constructor(private _postAppService: PostAppService) {}

  @ApiOperation({ summary: 'Mark seen post' })
  @ApiParam({
    name: 'id',
    description: 'Id of seen post',
    required: true,
  })
  @ApiOkResponse({
    type: Boolean,
  })
  @Put('/seen/:id')
  public async markSeenPost(
    @AuthUser() user: UserDto,
    @Param('id', ParseUUIDPipe) postId: string
  ): Promise<boolean> {
    await this._postAppService.markSeenPost(postId, user.id);
    return true;
  }

  @ApiOperation({ summary: 'Get audience post' })
  @ApiOkResponse({
    type: Boolean,
  })
  @Get('/:postId/audience')
  public async getAudience(
    @AuthUser() user: UserDto,
    @Param('postId', ParseUUIDPipe) postId: string,
    @Query() getAudienceContentDto: GetAudienceContentDto
  ): Promise<boolean> {
    return this._postAppService.getAudience(postId, user, getAudienceContentDto);
  }

  @ApiOperation({ summary: 'Pin/unpin content.' })
  @ApiOkResponse({
    type: PostResponseDto,
  })
  @ResponseMessages({ success: 'Pinned successfully!' })
  @Put('/:postId/pin')
  public async pinItem(
    @AuthUser() authUser: UserDto,
    @Param('postId', ParseUUIDPipe) postId: string,
    @Body() pinContentDto: PinContentDto
  ): Promise<void> {
    await this._postAppService.pinContent({
      postId,
      pinGroupIds: pinContentDto.pinGroupIds,
      unpinGroupIds: pinContentDto.unpinGroupIds,
      authUser,
    });
  }

  @ApiOperation({ summary: 'Get draft content' })
  @ApiOkResponse({
    type: ArticleResponseDto,
  })
  @Get('/draft')
  @Version([VERSIONS_SUPPORTED[0], VERSIONS_SUPPORTED[1]])
  public getDrafts(
    @AuthUser() user: UserDto,
    @Query() getDraftPostDto: GetDraftPostDto
  ): Promise<PageDto<ArticleResponseDto>> {
    return this._postAppService.getDraftPosts(user, getDraftPostDto);
  }

  @ApiOperation({ summary: 'Reorder pin content.' })
  @ApiOkResponse({
    type: PostResponseDto,
  })
  @ResponseMessages({ success: 'Reorder successfully!' })
  @Post('/group/:groupId/reorder')
  public async reorderItem(
    @AuthUser() authUser: UserDto,
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Body() postIds: string[]
  ): Promise<void> {
    await this._postAppService.reorderPinnedContent({
      groupId,
      postIds,
      authUser,
    });
  }
}
