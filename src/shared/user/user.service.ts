import { UserSharedDto } from './dto';
import { RedisService } from '@app/redis';
import { Injectable } from '@nestjs/common';
import { AppHelper } from '../../common/helpers/app.helper';
import { CACHE_KEYS } from '../../common/constants/casl.constant';
import { ExternalService } from '../../app/external.service';

@Injectable()
export class UserService {
  public constructor(private _store: RedisService, private _externalService: ExternalService) {}

  /**
   *  Get user info by id
   * @param userId ID of user
   * @returns Promise resolve user info
   */
  public async get(userId: string): Promise<UserSharedDto> {
    return {
      id: '6235bc91-2255-4f4b-bcfa-bebcd24e27ac',
      username: 'ngoclinh',
      fullname: 'Linh Linh',
      avatar:
        'https://bic-dev-entity-attribute-s3-bucket.s3.ap-southeast-1.amazonaws.com/user/avatar/images/original/91fae044-2182-47eb-97fb-c9e0bb6e5e6a.webp',
      email: 'ngoclinh@tgm.vn',
      groups: [
        '2c4bb803-8b87-4ff5-aa24-d28f1c959466',
        '09562521-eba0-42e7-bf01-1c9414955195',
        'd84a0771-699d-4ccc-b5f5-5b308d4ba14b',
        '06850d48-f2c4-44a2-a96c-9828b3fe2fae',
        'e2487d02-b7be-4185-8245-f7596eba1437',
        '818bd511-aa2e-4fb5-9973-c227e0ef3cc0',
        '868ae713-6365-43bd-85ef-cdc2c21eca9b',
        'f7bbd199-219b-49cf-abbc-c0d3ebe056be',
        '4408f9c8-f8d9-4741-8237-e53b3e70cd96',
        'c19c78a4-3690-4c39-8700-4842554dc54d',
        'a29bfb75-4d07-4f7c-9bb1-e1fdffead4ec',
        'beb02dd8-7fb8-4bc3-bc7f-05adcbd9b61e',
        '40c2d49d-20eb-462d-93de-67c29ea33fbc',
        '839cc8e9-ba87-4092-88cb-972f2e89f609',
        'e5aec0a8-e661-48fa-957a-900de7d6e0eb',
        '215a4c13-d3d2-44f4-9bdc-4fa28b1949c9',
        '35b5fb8f-6f7a-4ac2-90bb-18199096c429',
        '3dfc8748-f625-4f4d-a1bc-f958cc131994',
        'f4472c56-08a9-4612-b9b0-5fe3f25167b5',
        'd9dfec89-a3b3-44b0-a464-64a807518ac1',
        '82df17b0-4b57-400a-8bfa-e8ac7d27f529',
        '86616a93-2353-4f30-af69-53fc14c48a91',
        'b0bfca3d-0c06-49e4-941e-f6b3daf1bfe5',
        '90d650e8-68bc-4c1b-aa2c-c5d93be428f5',
        '556779ef-92f4-4b4a-b161-76a811941032',
        '7462673a-8078-4ec3-a82c-0d1a81796618',
        '48b9ed03-af3b-4ec7-ab60-2c68ef728a26',
        '7a7f74d0-3d3e-475c-b5b8-32362ce90c0c',
        '4c1b4093-a664-4a25-b40e-8dd29a8a6b93',
        '8f53339e-e8fd-4d70-a14a-32e64d870afe',
        '51fbf70d-a8c9-4a4a-b5d9-2b83459c3265',
        'e22e09b2-7956-483a-ab46-87db8a74c09d',
        'c31ea523-002c-4821-90c4-01ece5d63025',
        'ece52a62-6158-4cae-9ccd-a7b4bcc12c97',
        '3f2077f0-5ebd-45d4-b757-62327de2d713',
        '30453587-5c02-40fb-94df-6d9fd926df41',
        'fb17f160-de22-404d-be70-1414c4a229ed',
        'c983c7e3-c87f-4cda-80ce-61f537c89dd3',
        '047b81a9-c7e3-4c7c-98a4-ccb4f6eb37ef',
        '6286adb3-c957-4f87-abdb-f15670af73fe',
        '7d5a7033-5d78-40cc-8ab7-540580a844b0',
        '57defe75-dd8d-49fe-8a1c-65297b01757d',
        '77bbcead-6ff6-4a92-af6c-afd2c1f6f429',
        'c8cf048f-c291-4041-af92-1b6af0ef74f4',
        '4627b0d6-7e12-43c3-9750-61d0b4c03c8b',
        'f65af92c-b78e-4519-b195-7654139ae992',
        '346e076f-3762-4ad6-bd80-8f84b374cb55',
        'bd3e8a34-d642-4aee-a13e-30d1b1fdaa1b',
        '1d43514e-6a80-4912-8a53-c308063bb756',
        '4739cf1c-44f9-4d66-adad-c97abc94632c',
        'e3dd8f2e-fea4-4a36-ad2c-9514c6b0db05',
        'd3d5c620-98b7-4b28-94ef-0395c27203f9',
        '32b1cdda-ae64-4836-ac4e-0263a4828a30',
        '949ee208-162e-4990-ae81-ffa7916b386f',
        'de772dc3-9938-4633-88e5-6da9671d6331',
        '14eee684-7a40-487e-908e-a20ae2813525',
        'cba9e60b-0ca4-422c-9196-ef452ae44e22',
        '1a80fc4d-7aa7-4e2d-8858-d1dabdb8e09e',
        'fe3ce252-cd03-41b6-aa8a-ea27ab7a26aa',
        'd2ea57cc-f7e0-4d4f-be99-1d9d00d68b05',
        'ca20d746-3d03-48fb-a012-bac3fc4fd64a',
        '8f914eaa-821f-44b8-80e0-7bac69346397',
        '874887fe-6d1d-449d-936a-f89b104118c0',
        '0f5c4bb8-323b-41ee-8aed-b064fecf492b',
        'c4d8ce76-b229-4679-9172-23c7ed217271',
        '1fc06290-9a3c-4726-9615-174dbc8ff5d9',
        'c5a0cbc6-3716-4450-97c0-6d61093298b1',
        '2b15df32-ac56-47d8-ac63-aaa2dd199d00',
        '452f371c-58c3-45cb-abca-d68c70b82df2',
        '93586a89-6f4e-470e-ac37-42132f147552',
        'a2878812-95df-4810-b036-9967de528e6e',
        '85b2e8e6-9488-4bcf-8821-0d3dcffe6550',
        '10b3cfe3-21c0-4f75-9542-e00641745280',
        'b1cf8345-0338-44bf-9d1c-a3421e6f53a2',
        'a15c0db5-ce1e-430f-8a98-49822a0f502e',
        'ba53cc7a-ca6f-45d6-9a24-2f69de66e2ea',
        'b1da0659-adde-4800-a309-89ab945832b2',
        'b7b32c28-f032-4684-baee-5f042408e7b6',
        '44c7ceac-c4b5-418a-9271-faa882f91dea',
        '0a016870-ab8e-4775-a4f5-c0808867f125',
        'b01fb58e-9299-4a0e-a55f-9839293fb42a',
        '34ee0c87-050e-4d30-9a43-593bb1e7de0a',
        '991acb46-9d30-4179-b76d-9d48ef7f3bbe',
        'c496a048-9b39-4eb1-836e-5c4eaccf51ef',
        'a0ba8fb5-ae9e-4b18-8073-375d401166a8',
        '2d9fcec7-3a70-4951-8269-67f89d1cd97c',
        '0a795098-dd33-4eae-a2c6-d2d627f1c41b',
        'd69fe241-b911-49d5-a986-a24fca816797',
        '1cd3bdfe-f9aa-4a40-a644-557e21c04248',
        '52b8bb70-c091-4e71-af7e-3102aa515c92',
        '7f90d645-ea62-41f7-93cb-595e38d750ae',
        'eba85417-ec3e-49b4-89b4-c5393baecaaf',
        'ab551d44-7de3-4b33-8f14-7392d548b58c',
        '1eceeefc-fd93-454a-ba38-100c31690a16',
        '095b4ee2-a3b9-433c-a991-f53c93e6c708',
        'c4e14c31-3021-4eb9-bb06-404aec707615',
        '68464ae3-68ec-4232-8c73-30f9813948c4',
        '21e9d470-0217-4091-80b3-fe473f79d320',
        '91830f8b-3ab1-4899-8811-c4d18af457b5',
        'b091dab4-4afa-484b-b61e-217291c24b45',
        '354c5bca-8b57-4c21-9442-f250c1cc6d6d',
        '8bf653b8-c0bc-430f-aedb-4a88d4738df8',
        '896e4e71-21eb-4f4e-9916-c026c0f5c699',
        '9bd67c2b-8f79-4e00-8acc-86a450b230a7',
        '6b3c2ccc-bb12-4022-9c4d-7ad85bf6c766',
        'a51a566d-b47a-4924-ad62-6bc6162c805e',
        '4f2a225d-78cd-4cdc-89d9-2f8369e99629',
        'b34aad79-8b10-42b2-aafa-a895e59d8fae',
        '2fdbde64-a4e9-440a-a455-18a941ebcf8d',
        '9d402f73-1891-4a17-b3cf-9a69c34e9e04',
        '57f23f5c-b995-461b-afb5-5702688257c6',
        '9e37c2e4-dac6-4587-ae95-58c859533ad4',
        'ac86538b-8663-4b98-a03e-0ed17ec3f6be',
        'bd3eaf59-8103-4d7c-9cc4-f6baae8fca40',
        'eacb3c2b-7856-4d7b-bb44-b4c0313eb367',
        'ad0d32cf-c072-41f0-b485-c761d8d75787',
        '274dd34d-c75b-4e11-82ec-72548f84957e',
        '29583a76-2543-4def-95a4-b8e5116b47d6',
        '8b6e125e-5e8c-4c58-b30f-eadaba6c5b8e',
        '65ef1299-f7f2-439d-82f6-a242168ef974',
        'd9b40c0d-c079-4651-896d-ca1c27e9f39a',
      ],
    };
    //return this._store.get<UserSharedDto>(`${AppHelper.getRedisEnv()}SU:${userId}`);
  }

  public async getPermissions(userId: string, payload: string): Promise<any> {
    const cacheKey = `${CACHE_KEYS.USER_PERMISSIONS}:${userId}`;
    const permissionCached = await this._store.get(cacheKey);
    if (permissionCached) return permissionCached;
    return this._externalService.getPermission(payload);
  }

  /**
   *  Get users info by ids
   * @param userIds IDs of user
   * @returns Promise resolve users info
   */
  public async getMany(userIds: string[]): Promise<UserSharedDto[]> {
    const keys = [...new Set(userIds)].map((userId) => `${AppHelper.getRedisEnv()}SU:${userId}`);
    if (keys.length) {
      const users = await this._store.mget(keys);
      return users.filter((i) => i !== null);
    }
    return [];
  }
}
