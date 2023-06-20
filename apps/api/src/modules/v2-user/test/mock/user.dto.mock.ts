import { UserDto } from '../../../v2-user/application';
import { UserProps } from '../../domain/model/user';

export const userMocked: UserProps = {
  id: '7251dac7-5088-4a33-b900-d1b058edaf98',
  username: 'martine.baumbach',
  avatar: 'https://bein.group/baumbach.png',
  email: 'baumbach@tgm.vn',
  fullname: 'Martine Baumbach',
  groups: ['7251dac7-5088-4a33-b900-d1b058edaf99', '7251dac7-5088-4a33-b900-d1b058edaf90'],
};

export const userDto: UserDto = {
  id: '7251dac7-5088-4a33-b900-d1b058edaf98',
  username: 'martine.baumbach',
  avatar: 'https://bein.group/baumbach.png',
  email: 'baumbach@tgm.vn',
  fullname: 'Martine Baumbach',
  groups: ['7251dac7-5088-4a33-b900-d1b058edaf99', '7251dac7-5088-4a33-b900-d1b058edaf90'],
};

export const userDtoWithoutGroup: UserDto = {
  id: '7251dac7-5088-4a33-b900-d1b058edaf98',
  username: 'martine.baumbach',
  avatar: 'https://bein.group/baumbach.png',
  email: 'baumbach@tgm.vn',
  fullname: 'Martine Baumbach',
};

export const userPermissions = {
  communities: {
    'eabaf024-f1e5-428c-be0e-71d40efd1166': [
      'crud_post_article',
      'send_message',
      'edit_own_message',
      'delete_own_message',
      'crud_series',
      'edit_own_content_setting',
    ],
    'e32a2676-0fbe-4900-a00d-e2825329b24e': [
      'crud_custom_scheme',
      'edit_join_setting',
      'edit_info',
      'edit_privacy',
      'edit_own_content_setting',
      'send_message',
      'edit_own_message',
      'delete_own_message',
      'channel_mentions',
      'delete_others_message',
      'order_move_group_structure',
      'add_member',
      'remove_member',
      'approve_reject_jr',
      'assign_unassign_role',
      'crud_post_article',
      'crud_series',
      'crud_uc',
      'cud_terms',
      'pin_message',
      'create_delete_archive_groups',
      'create_delete_archive_groups',
      'pin_content',
      'cud_tags',
    ],
  },
  groups: {
    '7251dac7-5088-4a33-b900-d1b058edaf90': [
      'assign_unassign_role',
      'edit_join_setting',
      'edit_info',
      'edit_privacy',
      'crud_series',
      'edit_own_content_setting',
      'send_message',
      'edit_own_message',
      'delete_own_message',
      'channel_mentions',
      'delete_others_message',
      'add_member',
      'remove_member',
      'approve_reject_jr',
      'crud_post_article',
      'cud_terms',
      'pin_message',
      'pin_content',
      'cud_tags',
      'manage',
      'role_COMMUNITY_ADMIN',
      'role_OWNER',
      'role_GROUP_ADMIN',
    ],
    '89b1e805-6fc8-479d-9743-9161c223337f': [
      'crud_post_article',
      'send_message',
      'edit_own_message',
      'delete_own_message',
      'edit_own_content_setting',
      'crud_custom_scheme',
      'edit_join_setting',
      'edit_info',
      'edit_privacy',
      'channel_mentions',
      'delete_others_message',
      'order_move_group_structure',
      'add_member',
      'remove_member',
      'approve_reject_jr',
      'assign_unassign_role',
      'crud_series',
      'crud_uc',
      'cud_terms',
      'pin_message',
      'create_delete_archive_groups',
      'pin_content',
      'cud_tags',
      'role_COMMUNITY_ADMIN',
    ],
    '6b3c2ccc-bb12-4022-9c4d-7ad85bf6c766': [
      'crud_post_article',
      'send_message',
      'edit_own_message',
      'delete_own_message',
    ],
  },
  version: 2,
};