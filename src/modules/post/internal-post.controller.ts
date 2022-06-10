import { Controller, Get, Logger } from '@nestjs/common';
import { PostService } from './post.service';
import { EventPattern, Payload } from '@nestjs/microservices';
import { KAFKA_TOPIC } from '../../common/constants';
import { UpdatePrivacyDto } from './dto/requests/update-privacy.dto';
import { PostPrivacy } from '../../database/models/post.model';

@Controller('/test')
export class InternalPostController {
  private _logger = new Logger(InternalPostController.name);
  public constructor(private _postSevice: PostService) {}

  @EventPattern(KAFKA_TOPIC.BEIN_GROUP.UPDATED_PRIVACY_GROUP)
  public async privacyUpdate(@Payload('value') updatePrivacyDto: UpdatePrivacyDto): Promise<void> {
    this._logger.debug(`[privacyUpdate]: ${JSON.stringify(updatePrivacyDto)}`);
    const postIds = await this._postSevice.findPostIdsByGroupId([updatePrivacyDto.groupId], null);
    const postIdsNeedToUpdatePrivacy = await this._postSevice.filterPostIdsNeedToUpdatePrivacy(
      postIds,
      updatePrivacyDto.privacy
    );
    await this._postSevice.bulkUpdatePostPrivacy(
      postIdsNeedToUpdatePrivacy,
      updatePrivacyDto.privacy
    );
  }

  @Get('/')
  public async aprivacyUpdate(): Promise<void> {
    const updatePrivacyDto = {
      groupId: 1,
      privacy: PostPrivacy.SECRET,
    };
    this._logger.debug(`[privacyUpdate]: ${JSON.stringify(updatePrivacyDto)}`);
    const postIds = await this._postSevice.findPostIdsByGroupId([updatePrivacyDto.groupId], null);
    console.log('postIds=', postIds);
    const postIdsNeedToUpdatePrivacy = await this._postSevice.filterPostIdsNeedToUpdatePrivacy(
      postIds,
      updatePrivacyDto.privacy
    );
    console.log('postIdsNeedToUpdatePrivacy=', postIdsNeedToUpdatePrivacy);
    await this._postSevice.bulkUpdatePostPrivacy(
      postIdsNeedToUpdatePrivacy,
      updatePrivacyDto.privacy
    );
  }
}
