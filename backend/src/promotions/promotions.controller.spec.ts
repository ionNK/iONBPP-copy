import { Test, TestingModule } from '@nestjs/testing';
import { PromotionsController } from './promotions.controller';
import { PromotionsService } from './promotions.service';

describe('PromotionsController', () => {
  let controller: PromotionsController;
  let service: {
    create: jest.Mock;
    findAll: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PromotionsController],
      providers: [{ provide: PromotionsService, useValue: service }],
    }).compile();

    controller = module.get<PromotionsController>(PromotionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('create() delegates to service.create', () => {
    const dto = { name: 'X', type: 'cashback', config: {} } as any;
    service.create.mockReturnValue('created');

    expect(controller.create(dto)).toBe('created');
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('findAll() delegates to service.findAll', () => {
    service.findAll.mockReturnValue(['a']);

    expect(controller.findAll()).toEqual(['a']);
    expect(service.findAll).toHaveBeenCalledWith();
  });

  it('findOne() delegates to service.findOne with the id', () => {
    service.findOne.mockReturnValue({ id: 'p1' });

    expect(controller.findOne('p1')).toEqual({ id: 'p1' });
    expect(service.findOne).toHaveBeenCalledWith('p1');
  });

  it('update() delegates to service.update with id and dto', () => {
    const dto = { name: 'New' } as any;
    service.update.mockReturnValue('updated');

    expect(controller.update('p1', dto)).toBe('updated');
    expect(service.update).toHaveBeenCalledWith('p1', dto);
  });

  it('remove() delegates to service.remove with the id', () => {
    service.remove.mockReturnValue('removed');

    expect(controller.remove('p1')).toBe('removed');
    expect(service.remove).toHaveBeenCalledWith('p1');
  });
});
