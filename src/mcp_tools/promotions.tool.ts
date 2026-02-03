/**
 * Promotions Tool - ADK Function Tool for Promotion Operations
 * 
 * Developer: Yallaiah onter
 * Email: yallaiah.ai.enginner@gmail.com
 * 
 * This tool provides operations for reading and updating promotions in the e-commerce system.
 * All operations interact with the JSON-based data storage (promotions.json).
 */

import { FunctionTool } from '@google/adk';
import { z } from 'zod';
import { Storage, enableDynamicMode } from '../utils/storage';

// Promotion interface based on the data structure
interface Promotion {
  id: string;
  name: string;
  description?: string;
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'expired' | 'archived';
  discountType: 'percentage' | 'fixed_amount' | 'fixed_price' | 'buy_x_get_y' | 'free_shipping';
  discountValue?: number;
  target: 'all' | 'specific_products' | 'specific_categories' | 'specific_collections';
  targetIds?: string[];
  conditions?: Array<{
    type: string;
    value?: number | string | string[];
  }>;
  startDate?: string;
  endDate?: string;
  usageLimit?: number;
  usageCount?: number;
  createdAt: string;
  updatedAt: string;
}

// Enable dynamic mode for data operations (uses data/dynamic instead of data/seed)
enableDynamicMode();

// Initialize storage for promotions
const promotionsStorage = new Storage<Promotion>('promotions');

// ============================================================================
// Get Promotion By ID Tool Logic Start Here
// ============================================================================

/**
 * Retrieves a promotion by its ID.
 * 
 * @param args - Object containing promotionId
 * @returns Promotion details or error message
 */
function getPromotionById(args: { promotionId: string }): {
  status: string;
  promotion?: Promotion;
  error_message?: string;
} {
  try {
    const promotion = promotionsStorage.getById(args.promotionId);

    if (!promotion) {
      return {
        status: 'error',
        error_message: `Promotion with ID ${args.promotionId} not found`,
      };
    }

    return {
      status: 'success',
      promotion: promotion,
    };
  } catch (error) {
    return {
      status: 'error',
      error_message: `Failed to retrieve promotion: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// ============================================================================
// Get Promotion By ID Tool Logic End Here
// ============================================================================

// ============================================================================
// Get All Promotions Tool Logic Start Here
// ============================================================================

/**
 * Retrieves all promotions in the system.
 * 
 * @param args - Optional object with limit and offset for pagination
 * @returns List of all promotions or error message
 */
function getAllPromotions(args?: { limit?: number; offset?: number }): {
  status: string;
  promotions?: Promotion[];
  total?: number;
  limit?: number;
  offset?: number;
  error_message?: string;
} {
  try {
    const promotions = promotionsStorage.getAll();
    
    // Apply pagination if provided
    const limit = args?.limit || promotions.length;
    const offset = args?.offset || 0;
    const paginatedPromotions = promotions.slice(offset, offset + limit);

    return {
      status: 'success',
      promotions: paginatedPromotions,
      total: promotions.length,
      limit: limit,
      offset: offset,
    };
  } catch (error) {
    return {
      status: 'error',
      error_message: `Failed to retrieve promotions: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// ============================================================================
// Get All Promotions Tool Logic End Here
// ============================================================================

// ============================================================================
// Activate Promotion Tool Logic Start Here
// ============================================================================

/**
 * Activates a promotion by setting its status to 'active'.
 * 
 * @param args - Object containing promotionId
 * @returns Updated promotion or error message
 */
function activatePromotion(args: { promotionId: string }): {
  status: string;
  promotion?: Promotion;
  oldStatus?: string;
  error_message?: string;
} {
  try {
    const promotion = promotionsStorage.getById(args.promotionId);

    if (!promotion) {
      return {
        status: 'error',
        error_message: `Promotion with ID ${args.promotionId} not found`,
      };
    }

    if (promotion.status === 'active') {
      return {
        status: 'error',
        error_message: `Promotion ${args.promotionId} is already active`,
      };
    }

    if (promotion.status === 'archived' || promotion.status === 'expired') {
      return {
        status: 'error',
        error_message: `Cannot activate promotion ${args.promotionId}. Promotion is ${promotion.status}`,
      };
    }

    const oldStatus = promotion.status;
    const updatedPromotion = promotionsStorage.update(args.promotionId, {
      status: 'active',
      updatedAt: new Date().toISOString(),
    });

    if (!updatedPromotion) {
      return {
        status: 'error',
        error_message: `Failed to activate promotion ${args.promotionId}`,
      };
    }

    return {
      status: 'success',
      promotion: updatedPromotion,
      oldStatus: oldStatus,
    };
  } catch (error) {
    return {
      status: 'error',
      error_message: `Failed to activate promotion: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// ============================================================================
// Activate Promotion Tool Logic End Here
// ============================================================================

// ============================================================================
// Deactivate Promotion Tool Logic Start Here
// ============================================================================

/**
 * Deactivates a promotion by setting its status to 'paused'.
 * 
 * @param args - Object containing promotionId
 * @returns Updated promotion or error message
 */
function deactivatePromotion(args: { promotionId: string }): {
  status: string;
  promotion?: Promotion;
  oldStatus?: string;
  error_message?: string;
} {
  try {
    const promotion = promotionsStorage.getById(args.promotionId);

    if (!promotion) {
      return {
        status: 'error',
        error_message: `Promotion with ID ${args.promotionId} not found`,
      };
    }

    if (promotion.status === 'paused' || promotion.status === 'draft') {
      return {
        status: 'error',
        error_message: `Promotion ${args.promotionId} is already ${promotion.status}`,
      };
    }

    if (promotion.status === 'archived' || promotion.status === 'expired') {
      return {
        status: 'error',
        error_message: `Cannot deactivate promotion ${args.promotionId}. Promotion is ${promotion.status}`,
      };
    }

    const oldStatus = promotion.status;
    const updatedPromotion = promotionsStorage.update(args.promotionId, {
      status: 'paused',
      updatedAt: new Date().toISOString(),
    });

    if (!updatedPromotion) {
      return {
        status: 'error',
        error_message: `Failed to deactivate promotion ${args.promotionId}`,
      };
    }

    return {
      status: 'success',
      promotion: updatedPromotion,
      oldStatus: oldStatus,
    };
  } catch (error) {
    return {
      status: 'error',
      error_message: `Failed to deactivate promotion: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// ============================================================================
// Deactivate Promotion Tool Logic End Here
// ============================================================================

// ============================================================================
// Get Promotion Usage Tool Logic Start Here
// ============================================================================

/**
 * Gets the usage statistics of a promotion.
 * 
 * @param args - Object containing promotionId
 * @returns Promotion usage details or error message
 */
function getPromotionUsage(args: { promotionId: string }): {
  status: string;
  promotion?: Promotion;
  usageCount?: number;
  usageLimit?: number;
  remainingUsage?: number;
  error_message?: string;
} {
  try {
    const promotion = promotionsStorage.getById(args.promotionId);

    if (!promotion) {
      return {
        status: 'error',
        error_message: `Promotion with ID ${args.promotionId} not found`,
      };
    }

    const usageCount = promotion.usageCount || 0;
    const usageLimit = promotion.usageLimit;
    const remainingUsage = usageLimit ? usageLimit - usageCount : undefined;

    return {
      status: 'success',
      promotion: promotion,
      usageCount: usageCount,
      usageLimit: usageLimit,
      remainingUsage: remainingUsage,
    };
  } catch (error) {
    return {
      status: 'error',
      error_message: `Failed to get promotion usage: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// ============================================================================
// Get Promotion Usage Tool Logic End Here
// ============================================================================

// Export the underlying function for direct use
export { getAllPromotions };

// ============================================================================
// ADK Function Tools Export
// ============================================================================

/**
 * Tool to get promotion details by ID.
 * Used by agents to retrieve promotion information including status, discount details, and usage.
 */
export const getPromotionByIdTool = new FunctionTool({
  name: 'get_promotion_by_id',
  description: 'Retrieves a promotion by its ID. Returns promotion details including status, discount type, discount value, and usage statistics.',
  parameters: z.object({
    promotionId: z.string().describe('The unique identifier (ID) of the promotion to retrieve'),
  }),
  execute: getPromotionById,
});

/**
 * Tool to get all promotions in the system.
 * Used by agents to list all available promotions when user asks "what promotions do you have", "show all promotions", "list promotions", etc.
 */
export const getAllPromotionsTool = new FunctionTool({
  name: 'get_all_promotions',
  description: 'Retrieves all promotions in the system. Use this when user asks "what promotions do you have", "show all promotions", "list promotions", etc. Returns a list of all promotions with their details including name, status, discount type, and discount value. Optional pagination parameters (limit, offset) can be provided.',
  parameters: z.object({
    limit: z.number().optional().describe('Maximum number of promotions to return (default: all promotions)'),
    offset: z.number().optional().describe('Number of promotions to skip for pagination (default: 0)'),
  }),
  execute: getAllPromotions,
});

/**
 * Tool to activate a promotion.
 * Used by agents to activate promotions that are in draft, scheduled, or paused status.
 */
export const activatePromotionTool = new FunctionTool({
  name: 'activate_promotion',
  description: 'Activates a promotion by setting its status to active. Only works for promotions that are not archived or expired.',
  parameters: z.object({
    promotionId: z.string().describe('The unique identifier (ID) of the promotion to activate'),
  }),
  execute: activatePromotion,
});

/**
 * Tool to deactivate a promotion.
 * Used by agents to deactivate (pause) active promotions.
 */
export const deactivatePromotionTool = new FunctionTool({
  name: 'deactivate_promotion',
  description: 'Deactivates a promotion by setting its status to paused. Only works for active or scheduled promotions.',
  parameters: z.object({
    promotionId: z.string().describe('The unique identifier (ID) of the promotion to deactivate'),
  }),
  execute: deactivatePromotion,
});

/**
 * Tool to get promotion usage statistics.
 * Used by agents to check how many times a promotion has been used and if there are usage limits.
 */
export const getPromotionUsageTool = new FunctionTool({
  name: 'get_promotion_usage',
  description: 'Retrieves usage statistics for a promotion including usage count, usage limit, and remaining usage.',
  parameters: z.object({
    promotionId: z.string().describe('The unique identifier (ID) of the promotion to check usage for'),
  }),
  execute: getPromotionUsage,
});

