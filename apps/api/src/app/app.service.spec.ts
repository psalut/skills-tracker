import { Test } from '@nestjs/testing';
import { AppService } from './app.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AppService', () => {
  let service: AppService;
  const prismaService = {
    $queryRaw: jest.fn(),
  };

  beforeAll(async () => {
    const app = await Test.createTestingModule({
      providers: [
        AppService,
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    service = app.get<AppService>(AppService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getData', () => {
    it('should return "Hello API"', () => {
      expect(service.getData()).toEqual({ message: 'Hello API' });
    });
  });

  describe('warmupDatabase', () => {
    it('runs a lightweight database query', async () => {
      prismaService.$queryRaw.mockResolvedValueOnce([{ '?column?': 1 }]);

      await expect(service.warmupDatabase()).resolves.toEqual({ status: 'ok' });
      expect(prismaService.$queryRaw).toHaveBeenCalledTimes(1);
    });
  });
});
