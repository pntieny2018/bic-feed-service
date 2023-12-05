/* eslint-disable @typescript-eslint/unbound-method */
import { TestBed } from '@automock/jest';
import { ORDER } from '@beincom/constants';
import { PostGroupModel } from '@libs/database/postgres/model';
import { LibPostGroupRepository } from '@libs/database/postgres/repository';
import { v4 } from 'uuid';

import { PostGroupRepository } from '../../../driven-adapter/repository/post-group.repository';
import { createMockPostGroupRecord } from '../../mock/content.mock';

describe('PostGroupRepository', () => {
  let _postGroupRepo: PostGroupRepository;
  let _libPostGroupRepo: jest.Mocked<LibPostGroupRepository>;

  beforeEach(async () => {
    const { unit, unitRef } = TestBed.create(PostGroupRepository).compile();

    _postGroupRepo = unit;
    _libPostGroupRepo = unitRef.get(LibPostGroupRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getNotInStateGroupIds', () => {
    it('Should get group ids not in state success', async () => {
      const mockGroupIds = [v4(), v4()];
      const mockIsArchived = true;
      const mockPostGroupRecords = mockGroupIds.map((groupId) =>
        createMockPostGroupRecord({ groupId, isArchived: !mockIsArchived })
      );

      _libPostGroupRepo.findMany.mockResolvedValue(mockPostGroupRecords as PostGroupModel[]);

      const groupIds = await _postGroupRepo.getNotInStateGroupIds(mockGroupIds, mockIsArchived);

      expect(_libPostGroupRepo.findMany).toBeCalledWith({
        selectRaw: [
          ['DISTINCT group_id', 'groupId'],
          ['is_archived', 'isArchived'],
        ],
        where: {
          groupId: mockGroupIds,
          isArchived: !mockIsArchived,
        },
      });
      expect(groupIds).toEqual(mockGroupIds);
    });

    it('Should return empty array when group ids is empty', async () => {
      const mockGroupIds = [];
      const mockIsArchived = true;

      const groupIds = await _postGroupRepo.getNotInStateGroupIds(mockGroupIds, mockIsArchived);

      expect(_libPostGroupRepo.findMany).not.toBeCalled();
      expect(groupIds).toEqual(mockGroupIds);
    });
  });

  describe('getPagination', () => {
    it('Should get post group pagination success', async () => {
      const mockGroupIds = [v4(), v4()];
      const mockPostGroupRecords = mockGroupIds.map((groupId) =>
        createMockPostGroupRecord({ groupId })
      );

      _libPostGroupRepo.cursorPaginate.mockResolvedValue({
        rows: mockPostGroupRecords as PostGroupModel[],
        meta: {},
      });

      const result = await _postGroupRepo.getPagination({
        where: { groupIds: mockGroupIds },
        limit: 10,
      });

      expect(_libPostGroupRepo.cursorPaginate).toBeCalledWith(
        {
          where: {
            groupId: mockGroupIds,
          },
        },
        { limit: 10, order: ORDER.DESC, sortColumns: ['createdAt'] }
      );
      expect(result).toEqual({ rows: mockPostGroupRecords, meta: {} });
    });
  });

  describe('updateGroupState', () => {
    it('Should update group state success', async () => {
      const mockGroupIds = [v4(), v4()];
      const mockIsArchived = true;

      await _postGroupRepo.updateGroupState(mockGroupIds, mockIsArchived);

      expect(_libPostGroupRepo.update).toBeCalledWith(
        { isArchived: mockIsArchived },
        { where: { groupId: mockGroupIds } }
      );
    });

    it('Should not update when group ids empty', async () => {
      const mockGroupIds = [];
      const mockIsArchived = true;

      await _postGroupRepo.updateGroupState(mockGroupIds, mockIsArchived);

      expect(_libPostGroupRepo.update).not.toBeCalled();
    });
  });
});
