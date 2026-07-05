import { Test, TestingModule } from '@nestjs/testing';
import { ObjectifsService } from './objectifs.service';

describe('ObjectifsService', () => {
  let service: ObjectifsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ObjectifsService],
    }).compile();

    service = module.get<ObjectifsService>(ObjectifsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
