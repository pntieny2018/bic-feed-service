import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { APP_VERSION } from '../../common/constants';
import { ResponseMessages } from '../../common/decorators';
import { InjectUserToBody } from '../../common/decorators/inject.decorator';
import { PageDto } from '../../common/dto';
import { AuthUser } from '../auth';
import { PostAppService } from './application/post.app-service';
import {
  CreateFastlaneDto,
  CreatePostDto,
  GetPostDto,
  GetPostEditedHistoryDto,
  UpdatePostDto,
} from './dto/requests';
import { GetDraftPostDto } from './dto/requests/get-draft-posts.dto';
import { PostEditedHistoryDto, PostResponseDto } from './dto/responses';
import { GetPostPipe } from './pipes';
import { GetPostsByParamsDto } from './dto/requests/get-posts-by-params.dto';
import { UserDto } from '../v2-user/application';

@ApiSecurity('authorization')
@ApiTags('Pin content')
@Controller({
  version: APP_VERSION,
  path: 'pin',
})
export class PinController {
  public constructor(private _postAppService: PostAppService) {}
}
