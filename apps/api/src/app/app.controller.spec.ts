import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let app: TestingModule;
  const appService = {
    getData: jest.fn(() => ({ message: 'Hello API' })),
    warmupDatabase: jest.fn(async () => ({ status: 'ok' })),
  };

  beforeAll(async () => {
    app = await Test.createTestingModule({
      controllers: [AppController],
      providers: [{ provide: AppService, useValue: appService }],
    }).compile();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    appService.getData.mockReturnValue({ message: 'Hello API' });
    appService.warmupDatabase.mockResolvedValue({ status: 'ok' });
  });

  describe('getData', () => {
    it('should return "Hello API"', () => {
      const appController = app.get<AppController>(AppController);
      expect(appController.getData()).toEqual({ message: 'Hello API' });
    });
  });

  describe('warmupDatabase', () => {
    it('delegates to the app service', async () => {
      const appController = app.get<AppController>(AppController);

      await expect(appController.warmupDatabase()).resolves.toEqual({
        status: 'ok',
      });
      expect(appService.warmupDatabase).toHaveBeenCalledTimes(1);
    });
  });
});
