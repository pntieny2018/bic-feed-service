import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import {
  CONTENT_DOMAIN_SERVICE_TOKEN,
  IContentDomainService,
} from '../../../../domain/domain-service/interface';

import { UpdateContentSettingCommand } from './update-content-setting.command';

@CommandHandler(UpdateContentSettingCommand)
export class UpdateContentSettingHandler
  implements ICommandHandler<UpdateContentSettingCommand, void>
{
  public constructor(
    @Inject(CONTENT_DOMAIN_SERVICE_TOKEN)
    private readonly _contentDomainService: IContentDomainService
  ) {}

  public async execute(command: UpdateContentSettingCommand): Promise<void> {
    const { authUser, id, canComment, canReact, isImportant, importantExpiredAt } = command.payload;

    return this._contentDomainService.updateSetting({
      contentId: id,
      authUser,
      canComment,
      canReact,
      importantExpiredAt,
      isImportant,
    });
  }
}
