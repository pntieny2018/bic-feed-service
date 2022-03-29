import { PageDto } from './../../common/dto/pagination/page.dto';
import { AuthUser } from '../auth';
import {
  Controller,
  Delete,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  Put,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiSecurity, ApiOperation } from '@nestjs/swagger';
import { PostService } from './post.service';
import { CreatePostDto, GetPostDto } from './dto/requests';
import { GenericApiOkResponse } from '../../common/decorators';
import { UpdatePostDto } from './dto/requests/update-post.dto';
import { UserDto } from '../auth';
import { PostResponseDto } from './dto/responses';
import { GetDraftPostDto } from './dto/requests/get-draft-posts.dto';

@ApiSecurity('authorization')
@ApiTags('Posts')
@Controller('posts')
export class PostController {
  public constructor(private _postService: PostService) {}

  @ApiOperation({ summary: 'Get post detail' })
  @GenericApiOkResponse(PostResponseDto)
  @Get('/:postId')
  public getPost(
    @AuthUser() user: UserDto,
    @Param('postId', ParseIntPipe) postId: number,
    @Query() getPostDto: GetPostDto
  ): Promise<PostResponseDto> {
    return this._postService.getPost(postId, user, getPostDto);
  }

  @ApiOperation({ summary: 'Get post detail' })
  @GenericApiOkResponse(PostResponseDto)
  @Get('/draft')
  public getDraftPosts(
    @AuthUser() user: UserDto,
    @Query() getDraftPostDto: GetDraftPostDto
  ): Promise<PageDto<PostResponseDto>> {
    return this._postService.getDraftPosts(user.id, getDraftPostDto);
  }

  @ApiOperation({ summary: 'Create post' })
  @GenericApiOkResponse(Boolean, 'Create post successfully')
  @Post('/')
  public createPost(
    @AuthUser() user: UserDto,
    @Body() createPostDto: CreatePostDto
  ): Promise<boolean> {
    return this._postService.createPost(user.id, createPostDto);
  }

  @ApiOperation({ summary: 'Update post' })
  @GenericApiOkResponse(Boolean, 'Update post successfully')
  @Put('/:postId')
  public updatePost(
    @AuthUser() user: UserDto,
    @Param('postId', ParseIntPipe) postId: number,
    @Body() createPostDto: UpdatePostDto
  ): Promise<boolean> {
    return this._postService.updatePost(postId, user.id, createPostDto);
  }

  @ApiOperation({ summary: 'Publish post' })
  @GenericApiOkResponse(Boolean, 'Publish post successfully')
  @Put('/:postId/publish')
  public publishPost(
    @AuthUser() user: UserDto,
    @Param('postId', ParseIntPipe) postId: number
  ): Promise<boolean> {
    return this._postService.publishPost(postId, user.id);
  }

  @Delete('/:id')
  public deletePost(
    @AuthUser() user: UserDto,
    @Param('id', ParseIntPipe) postId: number
  ): Promise<boolean> {
    return this._postService.deletePost(postId, user.id);
  }
}
