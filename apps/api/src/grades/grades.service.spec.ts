import { Test, TestingModule } from '@nestjs/testing';
import { GradesService } from './grades.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('GradesService', () => {
  let service: GradesService;

  const mockPrisma = {
    classSubject: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
    gradeEntry: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    grade: {
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    activityLog: {
      create: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GradesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<GradesService>(GradesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getGradesByClass', () => {
    it('should return paginated grades', async () => {
      mockPrisma.gradeEntry.findMany.mockResolvedValue([]);
      mockPrisma.gradeEntry.count.mockResolvedValue(0);

      const result = await service.getGradesByClass('cs-1', 1, 20);

      expect(result.data).toEqual([]);
      expect(result.meta.page).toBe(1);
      expect(result.meta.total).toBe(0);
    });

    it('should throw NotFoundException when class subject not found', async () => {
      mockPrisma.classSubject.findUnique.mockResolvedValue(null);

      await expect(
        service.createBatch({
          classSubjectId: 'invalid',
          semesterId: 'sem-1',
          title: 'Test',
          inputMethod: 'MANUAL',
          grades: [],
        }, 'teacher-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
