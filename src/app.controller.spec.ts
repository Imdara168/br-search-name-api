import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(() => {
    appController = new AppController(new AppService());
  });

  describe('getHello', () => {
    it('returns the startup message', () => {
      expect(appController.getHello()).toEqual({
        message: 'NestJS API is running',
      });
    });
  });

  describe('getHealth', () => {
    it('returns ok status', () => {
      expect(appController.getHealth().status).toBe('ok');
    });
  });
});
