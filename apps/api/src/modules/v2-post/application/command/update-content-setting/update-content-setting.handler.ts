import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  IPostDomainService,
  POST_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface';
import { UpdateContentSettingCommand } from './update-content-setting.command';
import { CONTENT_REPOSITORY_TOKEN, IContentRepository } from '../../../domain/repositoty-interface';
import { ContentNotFoundException } from '../../../domain/exception';

@CommandHandler(UpdateContentSettingCommand)
export class UpdateContentSettingHandler
  implements ICommandHandler<UpdateContentSettingCommand, void>
{
  public constructor(
    @Inject(CONTENT_REPOSITORY_TOKEN) private readonly _contentRepository: IContentRepository,
    @Inject(POST_DOMAIN_SERVICE_TOKEN) private readonly _postDomainService: IPostDomainService
  ) {}

  public async execute(command: UpdateContentSettingCommand): Promise<void> {
    const { authUser, id, canComment, canReact, isImportant, importantExpiredAt } = command.payload;
    const contentEntity = await this._contentRepository.findOne({
      where: {
        id,
        groupArchived: false,
      },
      include: {
        shouldIncludeGroup: true,
      },
    });
    if (!contentEntity || contentEntity.isHidden()) {
      throw new ContentNotFoundException();
    }

    await this._postDomainService.updateSetting({
      entity: contentEntity,
      authUser,
      canComment,
      canReact,
      importantExpiredAt,
      isImportant,
    });
  }
}
