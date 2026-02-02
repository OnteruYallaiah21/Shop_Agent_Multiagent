/**
 * Orders Tool - ADK Function Tool for Order Operations
 * 
 * Developer: Yallaiah onter
 * Email: yallaiah.ai.enginner@gmail.com
 * 
 * This tool provides operations for reading and updating orders in the e-commerce system.
 * All operations interact with the JSON-based data storage (orders.json).
 */

import { FunctionTool } from '@google/adk';
import { z } from 'zod';
import { Storage, enableDynamicMode } from '../utils/storage';
import { Order, OrderStatus } from '../types';

// Enable dynamic mode for data operations (uses data/dynamic instead of data/seed)
enableDynamicMode();

// Initialize storage for orders
const ordersStorage = new Storage<Order>('orders');

// ============================================================================
// Get Order By Order Number Tool Logic Start Here
// ============================================================================

/**
 * Retrieves an order by its order number.
 * 
 * @param args - Object containing orderNumber
 * @returns Order details or error message
 */
function getOrderByOrderNumber(args: { orderNumber: string }): {
  status: string;
  order?: Order;
  error_message?: string;
} {
  try {
    const orders = ordersStorage.getAll();
    const order = orders.find((o) => o.orderNumber === args.orderNumber);

    if (!order) {
      return {
        status: 'error',
        error_message: `Order with order number ${args.orderNumber} not found`,
      };
    }

    return {
      status: 'success',
      order: order,
    };
  } catch (error) {
    return {
      status: 'error',
      error_message: `Failed to retrieve order: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// ============================================================================
// Get Order By Order Number Tool Logic End Here
// ============================================================================

// ============================================================================
// Update Order Status Tool Logic Start Here
// ============================================================================

/**
 * Updates the status of an order.
 * 
 * @param args - Object containing orderNumber and newStatus
 * @returns Updated order or error message
 */
function updateOrderStatus(args: { orderNumber: string; newStatus: OrderStatus }): {
  status: string;
  order?: Order;
  oldStatus?: OrderStatus;
  newStatus?: OrderStatus;
  error_message?: string;
} {
  try {
    const orders = ordersStorage.getAll();
    const orderIndex = orders.findIndex((o) => o.orderNumber === args.orderNumber);

    if (orderIndex === -1) {
      return {
        status: 'error',
        error_message: `Order with order number ${args.orderNumber} not found`,
      };
    }

    const oldStatus = orders[orderIndex].status;
    const updatedOrder = ordersStorage.update(orders[orderIndex].id, {
      status: args.newStatus,
      updatedAt: new Date().toISOString(),
    });

    if (!updatedOrder) {
      return {
        status: 'error',
        error_message: `Failed to update order ${args.orderNumber}`,
      };
    }

    return {
      status: 'success',
      order: updatedOrder,
      oldStatus: oldStatus,
      newStatus: args.newStatus,
    };
  } catch (error) {
    return {
      status: 'error',
      error_message: `Failed to update order status: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// ============================================================================
// Update Order Status Tool Logic End Here
// ============================================================================

// ============================================================================
// Cancel Order Tool Logic Start Here
// ============================================================================

/**
 * Cancels an order by setting its status to 'cancelled'.
 * 
 * @param args - Object containing orderNumber and optional cancelReason
 * @returns Updated order or error message
 */
function cancelOrder(args: { orderNumber: string; cancelReason?: string }): {
  status: string;
  order?: Order;
  error_message?: string;
} {
  try {
    const orders = ordersStorage.getAll();
    const order = orders.find((o) => o.orderNumber === args.orderNumber);

    if (!order) {
      return {
        status: 'error',
        error_message: `Order with order number ${args.orderNumber} not found`,
      };
    }

    // Check if order can be cancelled (not already shipped or delivered)
    if (order.status === 'shipped' || order.status === 'delivered') {
      return {
        status: 'error',
        error_message: `Cannot cancel order ${args.orderNumber}. Order has already been ${order.status}`,
      };
    }

    if (order.status === 'cancelled') {
      return {
        status: 'error',
        error_message: `Order ${args.orderNumber} is already cancelled`,
      };
    }

    const updatedOrder = ordersStorage.update(order.id, {
      status: 'cancelled' as OrderStatus,
      cancelReason: args.cancelReason || 'Cancelled by admin',
      cancelledAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    if (!updatedOrder) {
      return {
        status: 'error',
        error_message: `Failed to cancel order ${args.orderNumber}`,
      };
    }

    return {
      status: 'success',
      order: updatedOrder,
    };
  } catch (error) {
    return {
      status: 'error',
      error_message: `Failed to cancel order: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// ============================================================================
// Cancel Order Tool Logic End Here
// ============================================================================

// ============================================================================
// ADK Function Tools Export
// ============================================================================

/**
 * Tool to get order details by order number.
 * Used by agents to retrieve order information.
 */
export const getOrderByOrderNumberTool = new FunctionTool({
  name: 'get_order_by_order_number',
  description: 'Retrieves an order by its order number. Returns order details including status, line items, customer information, and totals.',
  parameters: z.object({
    orderNumber: z.string().describe('The order number (e.g., ORD-1001) to retrieve'),
  }),
  execute: getOrderByOrderNumber,
});

/**
 * Tool to update order status.
 * Used by agents to change order status (e.g., pending, confirmed, shipped, delivered, cancelled).
 */
export const updateOrderStatusTool = new FunctionTool({
  name: 'update_order_status',
  description: 'Updates the status of an order. Valid statuses: pending, confirmed, processing, shipped, delivered, cancelled.',
  parameters: z.object({
    orderNumber: z.string().describe('The order number (e.g., ORD-1001) to update'),
    newStatus: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']).describe('The new status to set for the order'),
  }),
  execute: updateOrderStatus,
});

/**
 * Tool to cancel an order.
 * Used by agents to cancel orders that are not yet shipped or delivered.
 */
export const cancelOrderTool = new FunctionTool({
  name: 'cancel_order',
  description: 'Cancels an order by setting its status to cancelled. Only works for orders that are not already shipped or delivered.',
  parameters: z.object({
    orderNumber: z.string().describe('The order number (e.g., ORD-1001) to cancel'),
    cancelReason: z.string().optional().describe('Optional reason for cancellation'),
  }),
  execute: cancelOrder,
});

