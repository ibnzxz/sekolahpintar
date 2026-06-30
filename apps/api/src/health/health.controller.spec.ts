import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { PrismaService } from '../prisma/prisma.service';

describe('HealthController', () => {
  let controller: HealthController;

  const mockPrisma = {
    $queryRaw: jest.fn().mockResolvedValue([{ '1': 1 }]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should return ok status when db is connected', async () => {
    const result = await controller.check();
    expect(result.status).toBe('ok');
    expect(result.database.connected).toBe(true);
  });

  it('should return error when db is down', async () => {
    mockPrisma.$queryRaw.mockRejectedValueOnce(new Error('DB down'));
    const result = await controller.check();
    expect(result.status).toBe('error');
    expect(result.database.connected).toBe(false);
  });
});
