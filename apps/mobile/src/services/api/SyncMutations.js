// Sync Mutations
// Story 1.2: Background Synchronization Service
// Implements: Task 3.2 (GraphQL mutation definitions)

import GraphQLClient from './GraphQLClient';

/**
 * Sync Mutations for Entity Synchronization
 * Defines GraphQL mutations for syncing each entity type
 *
 * NOTE: These are prepared for backend implementation
 * Currently using mock GraphQL client
 */

/**
 * Sync Farmer entity
 * Implements: Task 3.2
 */
export const syncFarmer = async (farmerData) => {
  const mutation = `
    mutation SyncFarmer($input: FarmerInput!) {
      syncFarmer(input: $input) {
        id
        name
        phone
        location
        language_preference
        updated_at
        sync_status
      }
    }
  `;

  try {
    const result = await GraphQLClient.mutate(mutation, {
      input: farmerData,
    });

    if (result.errors) {
      throw new Error(result.errors[0].message);
    }

    return result.data.syncFarmer || result.data;
  } catch (error) {
    console.error('[SyncMutations] syncFarmer failed:', error);
    throw error;
  }
};

/**
 * Sync Field entity
 */
export const syncField = async (fieldData) => {
  const mutation = `
    mutation SyncField($input: FieldInput!) {
      syncField(input: $input) {
        id
        farmer_id
        name
        acreage
        coordinates
        updated_at
        sync_status
      }
    }
  `;

  try {
    const result = await GraphQLClient.mutate(mutation, {
      input: fieldData,
    });

    if (result.errors) {
      throw new Error(result.errors[0].message);
    }

    return result.data.syncField || result.data;
  } catch (error) {
    console.error('[SyncMutations] syncField failed:', error);
    throw error;
  }
};

/**
 * Sync Crop entity
 */
export const syncCrop = async (cropData) => {
  const mutation = `
    mutation SyncCrop($input: CropInput!) {
      syncCrop(input: $input) {
        id
        field_id
        crop_type
        variety
        planting_date
        expected_harvest
        status
        updated_at
        sync_status
      }
    }
  `;

  try {
    const result = await GraphQLClient.mutate(mutation, {
      input: cropData,
    });

    if (result.errors) {
      throw new Error(result.errors[0].message);
    }

    return result.data.syncCrop || result.data;
  } catch (error) {
    console.error('[SyncMutations] syncCrop failed:', error);
    throw error;
  }
};

/**
 * Sync Query entity
 */
export const syncQuery = async (queryData) => {
  const mutation = `
    mutation SyncQuery($input: QueryInput!) {
      syncQuery(input: $input) {
        id
        farmer_id
        query_text
        query_type
        response
        updated_at
        sync_status
      }
    }
  `;

  try {
    const result = await GraphQLClient.mutate(mutation, {
      input: queryData,
    });

    if (result.errors) {
      throw new Error(result.errors[0].message);
    }

    return result.data.syncQuery || result.data;
  } catch (error) {
    console.error('[SyncMutations] syncQuery failed:', error);
    throw error;
  }
};

/**
 * Sync Image entity
 */
export const syncImage = async (imageData) => {
  const mutation = `
    mutation SyncImage($input: ImageInput!) {
      syncImage(input: $input) {
        id
        crop_id
        local_uri
        remote_url
        analysis_result
        updated_at
        sync_status
      }
    }
  `;

  try {
    const result = await GraphQLClient.mutate(mutation, {
      input: imageData,
    });

    if (result.errors) {
      throw new Error(result.errors[0].message);
    }

    return result.data.syncImage || result.data;
  } catch (error) {
    console.error('[SyncMutations] syncImage failed:', error);
    throw error;
  }
};

/**
 * Batch sync multiple entities
 * Implements: Task 3.3 (Batch sync operations)
 */
export const batchSync = async (entities) => {
  const mutation = `
    mutation BatchSync($entities: [EntityInput!]!) {
      batchSync(entities: $entities) {
        success
        results {
          id
          type
          status
          updated_at
          error
        }
      }
    }
  `;

  try {
    const result = await GraphQLClient.mutate(mutation, {
      entities,
    });

    if (result.errors) {
      throw new Error(result.errors[0].message);
    }

    return result.data.batchSync || result.data;
  } catch (error) {
    console.error('[SyncMutations] batchSync failed:', error);
    throw error;
  }
};

/**
 * Fetch remote entity for conflict resolution
 * Used to check if server has newer version
 */
export const fetchRemoteEntity = async (entityType, entityId) => {
  const query = `
    query FetchEntity($type: String!, $id: ID!) {
      entity(type: $type, id: $id) {
        id
        updated_at
        data
      }
    }
  `;

  try {
    const result = await GraphQLClient.query(query, {
      type: entityType,
      id: entityId,
    });

    if (result.errors) {
      throw new Error(result.errors[0].message);
    }

    return result.data.entity;
  } catch (error) {
    console.error('[SyncMutations] fetchRemoteEntity failed:', error);
    throw error;
  }
};

export default {
  syncFarmer,
  syncField,
  syncCrop,
  syncQuery,
  syncImage,
  batchSync,
  fetchRemoteEntity,
};
