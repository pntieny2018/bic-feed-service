import { UserSharedDto } from './../../shared/user/dto/user-shared.dto';
import { UserService } from './../../shared/user/user.service';
import { PostResponseDto } from './dto/responses/post.dto';
import { AuthUser } from './../auth/decorators/auth.decorator';
import {
  Controller,
  Delete,
  Get,
  Post,
  Query,
  Res,
  Body,
  Param,
  ParseIntPipe,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiSecurity, ApiOkResponse, ApiOperation, ApiParam } from '@nestjs/swagger';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/requests';

@ApiSecurity('authorization')
@ApiTags('Posts')
@Controller('posts')
export class PostController {
  public constructor(private _postService: PostService, private _userService: UserService) {}

  @ApiOperation({ summary: 'Create post' })
  @ApiOkResponse({
    description: 'Create post successfully',
    type: String,
  })
  @Post('/')
  public async createPost(@AuthUser() user: UserSharedDto, @Body() createPostDto: CreatePostDto) {
    return this._postService.createPost(user, createPostDto);
  }

  @ApiOperation({ summary: 'Delete recent search' })
  @ApiParam({
    name: 'id',
    description: 'Id of recent search item',
  })
  @ApiOkResponse({
    description: 'Get post detail',
    type: Boolean,
  })
  @Get('/:id')
  public getPost(@Param('id', ParseIntPipe) id: number) {
    return this._postService.getPost(id);
  }

  @ApiOperation({ summary: 'Delete recent search' })
  @ApiParam({
    name: 'id',
    description: 'Id of recent search item',
  })
  @ApiOkResponse({
    description: 'Delete recent search successfully',
    type: Boolean,
  })
  @Delete('/:id/delete')
  public deletePost(@Param('id', ParseIntPipe) id: number) {
    // return this._postService.delete(user.beinUserId, id);
  }
}
