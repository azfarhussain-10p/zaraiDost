// Farmer Repository Tests
// Story 1.1: Local Data Storage Foundation
// Implements: Task 6.1 (Unit tests for repository CRUD operations)

import { initDatabase, closeDatabase, resetDatabase } from '../../database/config/db.config';
import FarmerRepository from '../../database/repositories/FarmerRepository';

describe('FarmerRepository', () => {
  beforeAll(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  test('should create a farmer', async () => {
    const farmerData = {
      name: 'Test Farmer',
      phone: '+92-300-1234567',
      location: 'Test Location',
      language_preference: 'ur',
    };

    const farmer = await FarmerRepository.create(farmerData);

    expect(farmer).toBeDefined();
    expect(farmer.id).toBeDefined();
    expect(farmer.name).toBe(farmerData.name);
    expect(farmer.phone).toBe(farmerData.phone);
    expect(farmer.sync_status).toBe('pending');
  });

  test('should find farmer by ID', async () => {
    const farmerData = {
      name: 'Farmer Two',
      phone: '+92-301-1234567',
    };

    const created = await FarmerRepository.create(farmerData);
    const found = await FarmerRepository.findById(created.id);

    expect(found).toBeDefined();
    expect(found.id).toBe(created.id);
    expect(found.name).toBe(farmerData.name);
  });

  test('should update farmer', async () => {
    const farmer = await FarmerRepository.create({
      name: 'Original Name',
      phone: '+92-302-1234567',
    });

    const updated = await FarmerRepository.update(farmer.id, {
      name: 'Updated Name',
    });

    expect(updated.name).toBe('Updated Name');
    expect(updated.sync_status).toBe('pending');
  });

  test('should delete farmer', async () => {
    const farmer = await FarmerRepository.create({
      name: 'To Delete',
      phone: '+92-303-1234567',
    });

    const deleted = await FarmerRepository.delete(farmer.id);
    expect(deleted).toBe(true);

    const found = await FarmerRepository.findById(farmer.id);
    expect(found).toBeNull();
  });

  test('should find all farmers', async () => {
    await FarmerRepository.create({ name: 'Farmer A', phone: '+92-304-1234567' });
    await FarmerRepository.create({ name: 'Farmer B', phone: '+92-305-1234567' });

    const farmers = await FarmerRepository.findAll();
    expect(farmers.length).toBeGreaterThan(0);
  });
});

