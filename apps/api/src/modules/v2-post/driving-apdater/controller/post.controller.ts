import { BadRequestException, Body, Controller, ForbiddenException, Post } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import {
  classToPlain,
  ClassTransformer,
  instanceToPlain,
  TransformInstanceToPlain,
} from 'class-transformer';
import { ResponseMessages } from '../../../../common/decorators';
import { AuthUser } from '../../../auth';
import { UserDto } from '../../../v2-user/application';
import {
  ContentNoCRUDPermissionException,
  ContentNoEditSettingPermissionException,
} from '../../domain/exception';
import { CreateDraftPostRequestDto } from '../dto/request';
import { DomainModelException } from '../../../../common/exceptions/domain-model.exception';
import { CreateDraftPostCommand } from '../../application/command/create-draft-post/create-draft-post.command';
import { CreateDraftPostDto } from '../../application/command/create-draft-post/create-draft-post.dto';
import { TRANSFORMER_VISIBLE_ONLY } from '../../../../common/constants/transformer.constant';

@ApiTags('v2 Posts')
@ApiSecurity('authorization')
@Controller({
  version: '2',
  path: 'posts',
})
export class PostController {
  public constructor(
    private readonly _commandBus: CommandBus,
    private readonly _queryBus: QueryBus
  ) {}

  @ApiOperation({ summary: 'Create draft post' })
  @ResponseMessages({
    success: 'message.post.created_success',
  })
  @Post('/')
  @TransformInstanceToPlain({ groups: [TRANSFORMER_VISIBLE_ONLY.PUBLIC] })
  public async createDraft(
    @AuthUser() authUser: UserDto,
    @Body() createDraftPostRequestDto: CreateDraftPostRequestDto
  ): Promise<any> {
    const { audience } = createDraftPostRequestDto;
    try {
      const data = await this._commandBus.execute<CreateDraftPostCommand, CreateDraftPostDto>(
        new CreateDraftPostCommand({ groupIds: audience.groupIds, authUser })
      );
      return data;
    } catch (e) {
      switch (e.constructor) {
        case ContentNoEditSettingPermissionException:
        case ContentNoCRUDPermissionException:
          throw new ForbiddenException(e);
        case DomainModelException:
          throw new BadRequestException(e);
        default:
          throw e;
      }
    }
  }
}
