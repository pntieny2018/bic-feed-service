/* eslint-disable @typescript-eslint/unbound-method */
import { TestBed } from '@automock/jest';
import { CONTENT_TARGET, ORDER } from '@beincom/constants';
import { createMock } from '@golevelup/ts-jest';
import {
  ReportContentAttribute,
  ReportContentDetailAttributes,
  ReportContentModel,
} from '@libs/database/postgres/model';
import {
  LibUserReportContentDetailRepository,
  LibUserReportContentRepository,
} from '@libs/database/postgres/repository';
import { Transaction } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';

import { ReportEntity } from '../../../domain/model/report';
import { GetPaginationReportProps } from '../../../domain/repositoty-interface';
import { ReportMapper } from '../../../driven-adapter/mapper';
import { ReportRepository } from '../../../driven-adapter/repository';
import {
  createMockReportDetailRecord,
  createMockReportEntity,
  createMockReportRecord,
} from '../../mock';

jest.useFakeTimers();

describe('ReportRepository', () => {
  let _repo: ReportRepository;
  let _libReportRepo: jest.Mocked<LibUserReportContentRepository>;
  let _libReportDetailRepo: jest.Mocked<LibUserReportContentDetailRepository>;
  let _reportMapper: jest.Mocked<ReportMapper>;

  let _sequelizeConnection: Sequelize;
  let transaction: Transaction;

  let mockReportRecord: ReportContentAttribute;
  let mockReportDetailRecord: ReportContentDetailAttributes;
  let mockReportEntity: ReportEntity;

  beforeEach(async () => {
    const { unit, unitRef } = TestBed.create(ReportRepository).compile();

    _repo = unit;
    _libReportRepo = unitRef.get(LibUserReportContentRepository);
    _libReportDetailRepo = unitRef.get(LibUserReportContentDetailRepository);
    _reportMapper = unitRef.get(ReportMapper);

    _sequelizeConnection = unitRef.get(Sequelize);
    transaction = createMock<Transaction>();

    _sequelizeConnection.transaction = jest.fn().mockResolvedValue(transaction);

    mockReportDetailRecord = createMockReportDetailRecord();
    mockReportRecord = createMockReportRecord({
      id: mockReportDetailRecord.reportId,
      details: [mockReportDetailRecord],
    });
    mockReportEntity = createMockReportEntity(mockReportRecord);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findOne', () => {
    it('Should find report with details successfully', async () => {
      _libReportRepo.first.mockResolvedValue(mockReportRecord as ReportContentModel);
      _reportMapper.toDomain.mockReturnValue(mockReportEntity);

      const report = await _repo.findOne({
        where: { id: mockReportRecord.id },
        include: { details: true },
      });

      expect(_libReportRepo.first).toBeCalledWith({
        where: { id: mockReportRecord.id },
        include: [{ model: _libReportDetailRepo.getModel(), required: false, as: 'details' }],
      });
      expect(_reportMapper.toDomain).toBeCalledWith(mockReportRecord);
      expect(report).toEqual(mockReportEntity);
    });

    it('should return null if report not found', async () => {
      _libReportRepo.first.mockResolvedValue(null);
      _reportMapper.toDomain.mockReturnValue(null);

      const report = await _repo.findOne({
        where: { id: mockReportRecord.id },
        include: { details: true },
      });

      expect(_libReportRepo.first).toBeCalledWith({
        where: { id: mockReportRecord.id },
        include: [{ model: _libReportDetailRepo.getModel(), required: false, as: 'details' }],
      });
      expect(_reportMapper.toDomain).toBeCalledWith(null);
      expect(report).toBeNull();
    });
  });

  describe('getPagination', () => {
    it('should return a CursorPaginationResult object', async () => {
      const mockInput: GetPaginationReportProps = {
        where: {
          targetType: [CONTENT_TARGET.POST],
          targetActorId: mockReportRecord.authorId,
          status: mockReportRecord.status,
        },
        include: { details: true },
        limit: 10,
        order: ORDER.DESC,
      };

      _libReportRepo.cursorPaginate.mockResolvedValue({
        rows: [mockReportRecord] as ReportContentModel[],
        meta: { hasNextPage: false, hasPreviousPage: false },
      });
      _reportMapper.toDomain.mockReturnValue(mockReportEntity);

      const result = await _repo.getPagination(mockInput);

      expect(_libReportRepo.cursorPaginate).toBeCalledWith(
        {
          where: {
            targetType: [CONTENT_TARGET.POST],
            authorId: mockReportRecord.authorId,
            status: mockReportRecord.status,
          },
          include: [
            {
              model: _libReportDetailRepo.getModel(),
              required: true,
              as: 'details',
            },
          ],
        },
        { limit: 10, order: ORDER.DESC, column: 'createdAt' }
      );
      expect(_reportMapper.toDomain).toBeCalledWith(mockReportRecord);
      expect(result).toEqual({
        rows: [mockReportEntity],
        meta: { hasNextPage: false, hasPreviousPage: false },
      });
    });
  });

  describe('create', () => {
    it('Should create report with details successfully', async () => {
      _reportMapper.toPersistence.mockReturnValue(mockReportRecord);
      const { details, ...reportData } = mockReportRecord;

      await _repo.create(mockReportEntity);

      expect(_reportMapper.toPersistence).toBeCalledWith(mockReportEntity);
      expect(_libReportRepo.create).toBeCalledWith(reportData, { transaction });
      expect(_libReportDetailRepo.bulkCreate).toBeCalledWith([mockReportDetailRecord], {
        ignoreDuplicates: true,
        transaction,
      });
      expect(transaction.commit).toBeCalled();
      expect(transaction.rollback).not.toBeCalled();
    });

    it('Should create report without details successfully', async () => {
      const mockReportRecordWithoutDetails = createMockReportRecord({ details: undefined });
      const mockReportEntityWithoutDetails = createMockReportEntity(mockReportRecordWithoutDetails);

      _reportMapper.toPersistence.mockReturnValue(mockReportRecordWithoutDetails);

      await _repo.create(mockReportEntityWithoutDetails);

      expect(_reportMapper.toPersistence).toBeCalledWith(mockReportEntityWithoutDetails);
      expect(_libReportRepo.create).toBeCalledWith(mockReportRecordWithoutDetails, { transaction });
      expect(_libReportDetailRepo.bulkCreate).not.toBeCalled();
      expect(transaction.commit).toBeCalled();
      expect(transaction.rollback).not.toBeCalled();
    });

    it('Should rollback successfully', async () => {
      _reportMapper.toPersistence.mockReturnValue(mockReportRecord);
      _libReportRepo.create.mockRejectedValue(new Error());

      const { details, ...reportData } = mockReportRecord;

      try {
        await _repo.create(mockReportEntity);
      } catch (error) {
        expect(_reportMapper.toPersistence).toBeCalledWith(mockReportEntity);
        expect(_libReportRepo.create).toBeCalledWith(reportData, { transaction });
        expect(_libReportDetailRepo.bulkCreate).not.toBeCalled();
        expect(transaction.commit).not.toBeCalled();
        expect(transaction.rollback).toBeCalled();
      }
    });
  });

  describe('update', () => {
    it('Should update report successfully', async () => {
      const mockNewReportDetail = createMockReportDetailRecord({
        targetId: mockReportRecord.targetId,
        targetType: mockReportRecord.targetType,
        reportId: mockReportRecord.id,
      });
      mockReportEntity.addDetails([mockNewReportDetail]);
      mockNewReportDetail.id = mockReportEntity.getState().attachDetails[0].id;

      _reportMapper.toPersistence.mockReturnValue(mockReportRecord);

      await _repo.update(mockReportEntity);

      expect(_reportMapper.toPersistence).toBeCalledWith(mockReportEntity);
      expect(_libReportRepo.update).toBeCalledWith(
        { status: mockReportRecord.status },
        {
          where: { id: mockReportRecord.id },
          transaction,
        }
      );
      expect(_libReportDetailRepo.bulkCreate).toBeCalledWith([mockNewReportDetail], {
        ignoreDuplicates: true,
        transaction,
      });
      expect(transaction.commit).toBeCalled();
      expect(transaction.rollback).not.toBeCalled();
    });

    it('Should roll back successfully', async () => {
      _reportMapper.toPersistence.mockReturnValue(mockReportRecord);
      _libReportRepo.update.mockRejectedValue(new Error());

      try {
        await _repo.update(mockReportEntity);
      } catch (error) {
        expect(_reportMapper.toPersistence).toBeCalledWith(mockReportEntity);
        expect(_libReportRepo.update).toBeCalledWith(
          { status: mockReportRecord.status },
          {
            where: { id: mockReportRecord.id },
            transaction,
          }
        );
        expect(_libReportDetailRepo.bulkCreate).not.toBeCalled();
        expect(transaction.commit).not.toBeCalled();
        expect(transaction.rollback).toBeCalled();
      }
    });
  });
});
