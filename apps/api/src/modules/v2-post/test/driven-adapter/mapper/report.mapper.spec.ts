import { TestBed } from '@automock/jest';
import { ReportContentAttribute, ReportContentModel } from '@libs/database/postgres/model';

import { ReportEntity } from '../../../domain/model/report';
import { ReportMapper } from '../../../driven-adapter/mapper';
import { createMockReportEntity, createMockReportRecord } from '../../mock';

describe('ReportMapper', () => {
  let _mapper: ReportMapper;

  let mockReportRecord: ReportContentAttribute;
  let mockReportEntity: ReportEntity;

  beforeEach(async () => {
    const { unit } = TestBed.create(ReportMapper).compile();

    _mapper = unit;

    mockReportRecord = createMockReportRecord();
    mockReportEntity = createMockReportEntity(mockReportRecord);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('toDomain', () => {
    it('Should map report model to entity success', async () => {
      const reportEntity = _mapper.toDomain(mockReportRecord as ReportContentModel);

      expect(reportEntity).toEqual(mockReportEntity);
    });

    it('Should return null if report model is null', async () => {
      const reportEntity = _mapper.toDomain(null);

      expect(reportEntity).toBeNull();
    });
  });

  describe('toPersistence', () => {
    it('Should map report entity to record success', async () => {
      const reportRecord = _mapper.toPersistence(mockReportEntity);

      expect(reportRecord).toEqual(mockReportRecord);
    });
  });
});
