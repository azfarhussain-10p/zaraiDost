// HealthCheckRepository Tests
// Story 3.1: Image Capture and Upload Interface
// Tests for health check CRUD operations

import HealthCheckRepository from '../../../database/repositories/HealthCheckRepository';
import { getDatabase } from '../../../database/config/db.config';
import { HEALTH_CHECK_STATUS } from '../../../constants/ImageQualityConstants';

// Mock database
jest.mock('../../../database/config/db.config');

describe('HealthCheckRepository', () => {
  let mockDb;

  beforeEach(() => {
    mockDb = {
      runAsync: jest.fn().mockResolvedValue({}),
      getFirstAsync: jest.fn(),
      getAllAsync: jest.fn(),
    };
    getDatabase.mockResolvedValue(mockDb);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a health check with required fields', async () => {
      const healthCheckData = {
        farmerId: 'farmer-001',
        cropType: 'wheat',
      };

      mockDb.getFirstAsync.mockResolvedValue({
        id: 'test-id',
        farmer_id: 'farmer-001',
        crop_type: 'wheat',
        status: 'pending',
      });

      const result = await HealthCheckRepository.create(healthCheckData);

      expect(mockDb.runAsync).toHaveBeenCalled();
      expect(result).toHaveProperty('id');
      expect(result.farmer_id).toBe('farmer-001');
      expect(result.crop_type).toBe('wheat');
    });

    it('should create a health check with location', async () => {
      const healthCheckData = {
        farmerId: 'farmer-001',
        cropType: 'wheat',
        locationLatitude: 31.5042,
        locationLongitude: 74.3583,
        locationAccuracy: 10,
      };

      mockDb.getFirstAsync.mockResolvedValue({
        id: 'test-id',
        location_latitude: 31.5042,
        location_longitude: 74.3583,
        location_accuracy: 10,
      });

      const result = await HealthCheckRepository.create(healthCheckData);

      expect(result.location_latitude).toBe(31.5042);
      expect(result.location_longitude).toBe(74.3583);
      expect(result.location_accuracy).toBe(10);
    });

    it('should create a health check with description', async () => {
      const healthCheckData = {
        farmerId: 'farmer-001',
        cropType: 'wheat',
        description: 'Leaves turning yellow',
      };

      mockDb.getFirstAsync.mockResolvedValue({
        id: 'test-id',
        description: 'Leaves turning yellow',
      });

      const result = await HealthCheckRepository.create(healthCheckData);

      expect(result.description).toBe('Leaves turning yellow');
    });

    it('should set default status to pending', async () => {
      const healthCheckData = {
        farmerId: 'farmer-001',
        cropType: 'wheat',
      };

      mockDb.getFirstAsync.mockResolvedValue({
        id: 'test-id',
        status: 'pending',
      });

      const result = await HealthCheckRepository.create(healthCheckData);

      expect(result.status).toBe('pending');
    });
  });

  describe('findById', () => {
    it('should return health check by ID', async () => {
      mockDb.getFirstAsync.mockResolvedValue({
        id: 'test-id',
        farmer_id: 'farmer-001',
        crop_type: 'wheat',
      });

      const result = await HealthCheckRepository.findById('test-id');

      expect(mockDb.getFirstAsync).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM health_checks'),
        ['test-id']
      );
      expect(result).not.toBeNull();
      expect(result.id).toBe('test-id');
    });

    it('should return null if health check not found', async () => {
      mockDb.getFirstAsync.mockResolvedValue(null);

      const result = await HealthCheckRepository.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findByFarmer', () => {
    it('should return all health checks for a farmer', async () => {
      mockDb.getAllAsync.mockResolvedValue([
        { id: 'hc-1', farmer_id: 'farmer-001', crop_type: 'wheat' },
        { id: 'hc-2', farmer_id: 'farmer-001', crop_type: 'rice' },
      ]);

      const results = await HealthCheckRepository.findByFarmer('farmer-001');

      expect(mockDb.getAllAsync).toHaveBeenCalled();
      expect(results).toHaveLength(2);
      expect(results[0].id).toBe('hc-1');
    });

    it('should apply limit and offset', async () => {
      mockDb.getAllAsync.mockResolvedValue([]);

      await HealthCheckRepository.findByFarmer('farmer-001', {
        limit: 10,
        offset: 5,
      });

      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT ? OFFSET ?'),
        expect.arrayContaining([10, 5])
      );
    });

    it('should filter by status', async () => {
      mockDb.getAllAsync.mockResolvedValue([]);

      await HealthCheckRepository.findByFarmer('farmer-001', {
        status: 'completed',
      });

      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('AND status = ?'),
        expect.arrayContaining(['completed'])
      );
    });

    it('should return empty array if no health checks found', async () => {
      mockDb.getAllAsync.mockResolvedValue([]);

      const results = await HealthCheckRepository.findByFarmer('farmer-001');

      expect(results).toEqual([]);
    });
  });

  describe('updateStatus', () => {
    it('should update health check status', async () => {
      mockDb.runAsync.mockResolvedValue({});

      const result = await HealthCheckRepository.updateStatus(
        'test-id',
        HEALTH_CHECK_STATUS.COMPLETED
      );

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE health_checks'),
        expect.arrayContaining([HEALTH_CHECK_STATUS.COMPLETED, expect.any(String), 'test-id'])
      );
      expect(result).toBe(true);
    });
  });

  describe('updateImageCount', () => {
    it('should update image count', async () => {
      mockDb.runAsync.mockResolvedValue({});

      const result = await HealthCheckRepository.updateImageCount('test-id', 3);

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE health_checks'),
        expect.arrayContaining([3, expect.any(String), 'test-id'])
      );
      expect(result).toBe(true);
    });
  });

  describe('incrementImageCount', () => {
    it('should increment image count', async () => {
      mockDb.runAsync.mockResolvedValue({});
      mockDb.getFirstAsync.mockResolvedValue({
        id: 'test-id',
        image_count: 3,
      });

      const result = await HealthCheckRepository.incrementImageCount('test-id');

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('image_count = image_count + 1'),
        expect.any(Array)
      );
      expect(result).toBe(3);
    });

    it('should return 0 if health check not found', async () => {
      mockDb.runAsync.mockResolvedValue({});
      mockDb.getFirstAsync.mockResolvedValue(null);

      const result = await HealthCheckRepository.incrementImageCount('non-existent');

      expect(result).toBe(0);
    });
  });

  describe('saveOnDeviceResult', () => {
    it('should save on-device analysis result', async () => {
      mockDb.runAsync.mockResolvedValue({});

      const analysisResult = {
        disease: 'leaf_rust',
        confidence: 0.85,
        recommendations: ['Apply fungicide'],
      };

      const result = await HealthCheckRepository.saveOnDeviceResult(
        'test-id',
        analysisResult
      );

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE health_checks'),
        expect.arrayContaining([
          JSON.stringify(analysisResult),
          HEALTH_CHECK_STATUS.COMPLETED,
          expect.any(String),
          'test-id',
        ])
      );
      expect(result).toBe(true);
    });
  });

  describe('getPendingSync', () => {
    it('should return health checks with pending sync status', async () => {
      mockDb.getAllAsync.mockResolvedValue([
        { id: 'hc-1', sync_status: 'pending' },
        { id: 'hc-2', sync_status: 'pending' },
      ]);

      const results = await HealthCheckRepository.getPendingSync();

      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('WHERE sync_status = \'pending\''),
        expect.any(Array)
      );
      expect(results).toHaveLength(2);
    });
  });

  describe('getStatistics', () => {
    it('should return statistics for a farmer', async () => {
      mockDb.getFirstAsync.mockResolvedValue({
        total: 10,
        completed: 7,
        pending: 2,
        analyzing: 1,
        failed: 0,
        total_images: 35,
      });

      const stats = await HealthCheckRepository.getStatistics('farmer-001');

      expect(stats.total).toBe(10);
      expect(stats.completed).toBe(7);
      expect(stats.total_images).toBe(35);
    });

    it('should return zero statistics if no health checks', async () => {
      mockDb.getFirstAsync.mockResolvedValue(null);

      const stats = await HealthCheckRepository.getStatistics('farmer-001');

      expect(stats.total).toBe(0);
      expect(stats.completed).toBe(0);
    });
  });

  describe('delete', () => {
    it('should delete health check by ID', async () => {
      mockDb.runAsync.mockResolvedValue({});

      const result = await HealthCheckRepository.delete('test-id');

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM health_checks'),
        ['test-id']
      );
      expect(result).toBe(true);
    });
  });

  describe('searchByCropType', () => {
    it('should return health checks for specific crop type', async () => {
      mockDb.getAllAsync.mockResolvedValue([
        { id: 'hc-1', crop_type: 'wheat' },
        { id: 'hc-2', crop_type: 'wheat' },
      ]);

      const results = await HealthCheckRepository.searchByCropType(
        'farmer-001',
        'wheat'
      );

      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('AND crop_type = ?'),
        ['farmer-001', 'wheat']
      );
      expect(results).toHaveLength(2);
    });
  });
});

