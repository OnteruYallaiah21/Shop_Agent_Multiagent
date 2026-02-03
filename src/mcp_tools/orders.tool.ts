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
import { Order, OrderStatus, PaymentStatus, FulfillmentStatus, OrderNote, OrderShipment, OrderRefund, OrderTransaction, Address } from '../types';

// Enable dynamic mode for data operations (uses data/dynamic instead of data/seed)
enableDynamicMode();

// Initialize storage for orders and related entities
const ordersStorage = new Storage<Order>('orders');
const notesStorage = new Storage<OrderNote>('order_notes');
const shipmentsStorage = new Storage<OrderShipment>('shipments');
const refundsStorage = new Storage<OrderRefund>('refunds');
const transactionsStorage = new Storage<OrderTransaction>('transactions');

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
// Get Order By ID Tool Logic Start Here
// ============================================================================

/**
 * Retrieves an order by its ID.
 * 
 * @param args - Object containing orderId
 * @returns Order details or error message
 */
function getOrderById(args: { orderId: string }): {
  status: string;
  order?: Order;
  error_message?: string;
} {
  try {
    const order = ordersStorage.getById(args.orderId);

    if (!order) {
      return {
        status: 'error',
        error_message: `Order with ID ${args.orderId} not found`,
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
// Get Order By ID Tool Logic End Here
// ============================================================================

// ============================================================================
// Get All Orders Tool Logic Start Here
// ============================================================================

/**
 * Retrieves all orders in the system.
 * 
 * @param args - Optional object with limit and offset for pagination
 * @returns List of all orders or error message
 */
function getAllOrders(args?: { limit?: number; offset?: number }): {
  status: string;
  orders?: Order[];
  total?: number;
  limit?: number;
  offset?: number;
  error_message?: string;
} {
  try {
    const orders = ordersStorage.getAll();
    
    // Apply pagination if provided
    const limit = args?.limit || orders.length;
    const offset = args?.offset || 0;
    const paginatedOrders = orders.slice(offset, offset + limit);

    return {
      status: 'success',
      orders: paginatedOrders,
      total: orders.length,
      limit: limit,
      offset: offset,
    };
  } catch (error) {
    return {
      status: 'error',
      error_message: `Failed to retrieve orders: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// ============================================================================
// Get All Orders Tool Logic End Here
// ============================================================================

// ============================================================================
// Get Orders By Status Tool Logic Start Here
// ============================================================================

/**
 * Retrieves orders filtered by status.
 * 
 * @param args - Object containing status and optional pagination
 * @returns List of orders with matching status
 */
function getOrdersByStatus(args: { status: OrderStatus; limit?: number; offset?: number }): {
  status: string;
  orders?: Order[];
  total?: number;
  error_message?: string;
} {
  try {
    const orders = ordersStorage.getAll();
    const filtered = orders.filter((o) => o.status === args.status);
    
    const limit = args.limit || filtered.length;
    const offset = args.offset || 0;
    const paginated = filtered.slice(offset, offset + limit);

    return {
      status: 'success',
      orders: paginated,
      total: filtered.length,
    };
  } catch (error) {
    return {
      status: 'error',
      error_message: `Failed to retrieve orders: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// ============================================================================
// Get Orders By Status Tool Logic End Here
// ============================================================================

// ============================================================================
// Get Orders By Customer ID Tool Logic Start Here
// ============================================================================

/**
 * Retrieves orders filtered by customer ID.
 * 
 * @param args - Object containing customerId and optional pagination
 * @returns List of orders for the customer
 */
function getOrdersByCustomerId(args: { customerId: string; limit?: number; offset?: number }): {
  status: string;
  orders?: Order[];
  total?: number;
  error_message?: string;
} {
  try {
    const orders = ordersStorage.getAll();
    const filtered = orders.filter((o) => o.customerId === args.customerId);
    
    const limit = args.limit || filtered.length;
    const offset = args.offset || 0;
    const paginated = filtered.slice(offset, offset + limit);

    return {
      status: 'success',
      orders: paginated,
      total: filtered.length,
    };
  } catch (error) {
    return {
      status: 'error',
      error_message: `Failed to retrieve orders: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// ============================================================================
// Get Orders By Customer ID Tool Logic End Here
// ============================================================================

// ============================================================================
// Get Orders By Customer Email Tool Logic Start Here
// ============================================================================

/**
 * Retrieves orders filtered by customer email.
 * 
 * @param args - Object containing customerEmail and optional pagination
 * @returns List of orders for the customer email
 */
function getOrdersByCustomerEmail(args: { customerEmail: string; limit?: number; offset?: number }): {
  status: string;
  orders?: Order[];
  total?: number;
  error_message?: string;
} {
  try {
    const orders = ordersStorage.getAll();
    const filtered = orders.filter((o) => o.customerEmail.toLowerCase() === args.customerEmail.toLowerCase());
    
    const limit = args.limit || filtered.length;
    const offset = args.offset || 0;
    const paginated = filtered.slice(offset, offset + limit);

    return {
      status: 'success',
      orders: paginated,
      total: filtered.length,
    };
  } catch (error) {
    return {
      status: 'error',
      error_message: `Failed to retrieve orders: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// ============================================================================
// Get Orders By Customer Email Tool Logic End Here
// ============================================================================

// ============================================================================
// Get Orders By Payment Status Tool Logic Start Here
// ============================================================================

/**
 * Retrieves orders filtered by payment status.
 * 
 * @param args - Object containing paymentStatus and optional pagination
 * @returns List of orders with matching payment status
 */
function getOrdersByPaymentStatus(args: { paymentStatus: PaymentStatus; limit?: number; offset?: number }): {
  status: string;
  orders?: Order[];
  total?: number;
  error_message?: string;
} {
  try {
    const orders = ordersStorage.getAll();
    const filtered = orders.filter((o) => o.paymentStatus === args.paymentStatus);
    
    const limit = args.limit || filtered.length;
    const offset = args.offset || 0;
    const paginated = filtered.slice(offset, offset + limit);

    return {
      status: 'success',
      orders: paginated,
      total: filtered.length,
    };
  } catch (error) {
    return {
      status: 'error',
      error_message: `Failed to retrieve orders: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// ============================================================================
// Get Orders By Payment Status Tool Logic End Here
// ============================================================================

// ============================================================================
// Get Orders By Fulfillment Status Tool Logic Start Here
// ============================================================================

/**
 * Retrieves orders filtered by fulfillment status.
 * 
 * @param args - Object containing fulfillmentStatus and optional pagination
 * @returns List of orders with matching fulfillment status
 */
function getOrdersByFulfillmentStatus(args: { fulfillmentStatus: FulfillmentStatus; limit?: number; offset?: number }): {
  status: string;
  orders?: Order[];
  total?: number;
  error_message?: string;
} {
  try {
    const orders = ordersStorage.getAll();
    const filtered = orders.filter((o) => o.fulfillmentStatus === args.fulfillmentStatus);
    
    const limit = args.limit || filtered.length;
    const offset = args.offset || 0;
    const paginated = filtered.slice(offset, offset + limit);

    return {
      status: 'success',
      orders: paginated,
      total: filtered.length,
    };
  } catch (error) {
    return {
      status: 'error',
      error_message: `Failed to retrieve orders: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// ============================================================================
// Get Orders By Fulfillment Status Tool Logic End Here
// ============================================================================

// ============================================================================
// Get Orders By Date Range Tool Logic Start Here
// ============================================================================

/**
 * Retrieves orders filtered by date range.
 * 
 * @param args - Object containing startDate and/or endDate, and optional pagination
 * @returns List of orders within the date range
 */
function getOrdersByDateRange(args: { startDate?: string; endDate?: string; limit?: number; offset?: number }): {
  status: string;
  orders?: Order[];
  total?: number;
  error_message?: string;
} {
  try {
    const orders = ordersStorage.getAll();
    const filtered = orders.filter((o) => {
      const orderDate = new Date(o.createdAt);
      if (args.startDate && orderDate < new Date(args.startDate)) return false;
      if (args.endDate && orderDate > new Date(args.endDate)) return false;
      return true;
    });
    
    const limit = args.limit || filtered.length;
    const offset = args.offset || 0;
    const paginated = filtered.slice(offset, offset + limit);

    return {
      status: 'success',
      orders: paginated,
      total: filtered.length,
    };
  } catch (error) {
    return {
      status: 'error',
      error_message: `Failed to retrieve orders: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// ============================================================================
// Get Orders By Date Range Tool Logic End Here
// ============================================================================

// ============================================================================
// Search Orders Tool Logic Start Here
// ============================================================================

/**
 * Searches orders by order number, customer email, or customer name.
 * 
 * @param args - Object containing search query and optional pagination
 * @returns List of orders matching the search
 */
function searchOrders(args: { query: string; limit?: number; offset?: number }): {
  status: string;
  orders?: Order[];
  total?: number;
  error_message?: string;
} {
  try {
    const orders = ordersStorage.getAll();
    const query = args.query.toLowerCase();
    const filtered = orders.filter((o) => 
      o.orderNumber.toLowerCase().includes(query) || 
      o.customerEmail.toLowerCase().includes(query) ||
      `${o.billingAddress.firstName} ${o.billingAddress.lastName}`.toLowerCase().includes(query)
    );
    
    const limit = args.limit || filtered.length;
    const offset = args.offset || 0;
    const paginated = filtered.slice(offset, offset + limit);

    return {
      status: 'success',
      orders: paginated,
      total: filtered.length,
    };
  } catch (error) {
    return {
      status: 'error',
      error_message: `Failed to search orders: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// ============================================================================
// Search Orders Tool Logic End Here
// ============================================================================

// ============================================================================
// Get Order Notes Tool Logic Start Here
// ============================================================================

/**
 * Retrieves all notes for an order.
 * 
 * @param args - Object containing orderNumber
 * @returns List of order notes
 */
function getOrderNotes(args: { orderNumber: string }): {
  status: string;
  notes?: OrderNote[];
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

    const allNotes = notesStorage.getAll();
    const notes = allNotes.filter((n) => n.orderId === order.id);

    return {
      status: 'success',
      notes: notes || [],
    };
  } catch (error) {
    return {
      status: 'error',
      error_message: `Failed to retrieve order notes: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// ============================================================================
// Get Order Notes Tool Logic End Here
// ============================================================================

// ============================================================================
// Add Order Note Tool Logic Start Here
// ============================================================================

/**
 * Adds a note to an order.
 * 
 * @param args - Object containing orderNumber, content, and optional isPrivate
 * @returns Created note or error message
 */
export function addOrderNote(args: { orderNumber: string; content: string; isPrivate?: boolean }): {
  status: string;
  note?: OrderNote;
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

    const note: OrderNote = {
      id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      orderId: order.id,
      content: args.content,
      isPrivate: args.isPrivate ?? false,
      createdAt: new Date().toISOString(),
    };

    notesStorage.create(note);

    return {
      status: 'success',
      note: note,
    };
  } catch (error) {
    return {
      status: 'error',
      error_message: `Failed to add order note: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// ============================================================================
// Add Order Note Tool Logic End Here
// ============================================================================

// ============================================================================
// Get Order Shipments Tool Logic Start Here
// ============================================================================

/**
 * Retrieves all shipments for an order.
 * 
 * @param args - Object containing orderNumber
 * @returns List of order shipments
 */
function getOrderShipments(args: { orderNumber: string }): {
  status: string;
  shipments?: OrderShipment[];
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

    const allShipments = shipmentsStorage.getAll();
    const shipments = allShipments.filter((s) => s.orderId === order.id);

    return {
      status: 'success',
      shipments: shipments || [],
    };
  } catch (error) {
    return {
      status: 'error',
      error_message: `Failed to retrieve order shipments: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// ============================================================================
// Get Order Shipments Tool Logic End Here
// ============================================================================

// ============================================================================
// Get Order Refunds Tool Logic Start Here
// ============================================================================

/**
 * Retrieves all refunds for an order.
 * 
 * @param args - Object containing orderNumber
 * @returns List of order refunds
 */
function getOrderRefunds(args: { orderNumber: string }): {
  status: string;
  refunds?: OrderRefund[];
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

    const allRefunds = refundsStorage.getAll();
    const refunds = allRefunds.filter((r) => r.orderId === order.id);

    return {
      status: 'success',
      refunds: refunds || [],
    };
  } catch (error) {
    return {
      status: 'error',
      error_message: `Failed to retrieve order refunds: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// ============================================================================
// Get Order Refunds Tool Logic End Here
// ============================================================================

// ============================================================================
// Get Order Transactions Tool Logic Start Here
// ============================================================================

/**
 * Retrieves all transactions for an order.
 * 
 * @param args - Object containing orderNumber
 * @returns List of order transactions
 */
function getOrderTransactions(args: { orderNumber: string }): {
  status: string;
  transactions?: OrderTransaction[];
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

    const allTransactions = transactionsStorage.getAll();
    const transactions = allTransactions.filter((t) => t.orderId === order.id);

    return {
      status: 'success',
      transactions: transactions || [],
    };
  } catch (error) {
    return {
      status: 'error',
      error_message: `Failed to retrieve order transactions: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// ============================================================================
// Get Order Transactions Tool Logic End Here
// ============================================================================

// ============================================================================
// Update Order Shipping Address Tool Logic Start Here
// ============================================================================

/**
 * Updates the shipping address of an order.
 * 
 * @param args - Object containing orderNumber and shippingAddress
 * @returns Updated order or error message
 */
export function updateOrderShippingAddress(args: { orderNumber: string; shippingAddress: Address }): {
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

    const updatedOrder = ordersStorage.update(order.id, {
      shippingAddress: args.shippingAddress,
      updatedAt: new Date().toISOString(),
    });

    if (!updatedOrder) {
      return {
        status: 'error',
        error_message: `Failed to update shipping address for order ${args.orderNumber}`,
      };
    }

    return {
      status: 'success',
      order: updatedOrder,
    };
  } catch (error) {
    return {
      status: 'error',
      error_message: `Failed to update shipping address: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// ============================================================================
// Update Order Shipping Address Tool Logic End Here
// ============================================================================

// ============================================================================
// Update Order Billing Address Tool Logic Start Here
// ============================================================================

/**
 * Updates the billing address of an order.
 * 
 * @param args - Object containing orderNumber and billingAddress
 * @returns Updated order or error message
 */
export function updateOrderBillingAddress(args: { orderNumber: string; billingAddress: Address }): {
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

    const updatedOrder = ordersStorage.update(order.id, {
      billingAddress: args.billingAddress,
      updatedAt: new Date().toISOString(),
    });

    if (!updatedOrder) {
      return {
        status: 'error',
        error_message: `Failed to update billing address for order ${args.orderNumber}`,
      };
    }

    return {
      status: 'success',
      order: updatedOrder,
    };
  } catch (error) {
    return {
      status: 'error',
      error_message: `Failed to update billing address: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// ============================================================================
// Update Order Billing Address Tool Logic End Here
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
export function updateOrderStatus(args: { orderNumber: string; newStatus: OrderStatus }): {
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
export function cancelOrder(args: { orderNumber: string; cancelReason?: string }): {
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
// Archive Order Tool Logic Start Here
// ============================================================================

/**
 * Archives an order by adding a special tag and updating metadata.
 * This is a SAFE replacement for delete - preserves all order data for audit trail.
 * 
 * @param args - Object containing orderNumber
 * @returns Updated order or error message
 */
function archiveOrder(args: { orderNumber: string }): {
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

    // Add archive tag if not already present
    const tags = order.tags || [];
    if (!tags.includes('archived')) {
      tags.push('archived');
    }

    const updatedOrder = ordersStorage.update(order.id, {
      tags: tags,
      updatedAt: new Date().toISOString(),
    });

    if (!updatedOrder) {
      return {
        status: 'error',
        error_message: `Failed to archive order ${args.orderNumber}`,
      };
    }

    return {
      status: 'success',
      order: updatedOrder,
    };
  } catch (error) {
    return {
      status: 'error',
      error_message: `Failed to archive order: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Unarchives an order by removing the archive tag.
 * This allows recovery of archived orders.
 * 
 * @param args - Object containing orderNumber
 * @returns Updated order or error message
 */
function unarchiveOrder(args: { orderNumber: string }): {
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

    // Remove archive tag
    const tags = (order.tags || []).filter((tag) => tag !== 'archived');

    const updatedOrder = ordersStorage.update(order.id, {
      tags: tags,
      updatedAt: new Date().toISOString(),
    });

    if (!updatedOrder) {
      return {
        status: 'error',
        error_message: `Failed to unarchive order ${args.orderNumber}`,
      };
    }

    return {
      status: 'success',
      order: updatedOrder,
    };
  } catch (error) {
    return {
      status: 'error',
      error_message: `Failed to unarchive order: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// ============================================================================
// Archive Order Tool Logic End Here
// ============================================================================

// Export the underlying functions for direct use
export { getAllOrders, archiveOrder, unarchiveOrder };

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
 * Tool to get all orders in the system.
 * Used by agents to list all available orders when user asks "what orders do you have", "show all orders", "list orders", etc.
 */
export const getAllOrdersTool = new FunctionTool({
  name: 'get_all_orders',
  description: 'Retrieves all orders in the system. Use this when user asks "what orders do you have", "show all orders", "list orders", etc. Returns a list of all orders with their details including order number, status, customer, and totals. Optional pagination parameters (limit, offset) can be provided.',
  parameters: z.object({
    limit: z.number().optional().describe('Maximum number of orders to return (default: all orders)'),
    offset: z.number().optional().describe('Number of orders to skip for pagination (default: 0)'),
  }),
  execute: getAllOrders,
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

/**
 * Tool to get order details by ID.
 * Used by agents to retrieve order information by order ID.
 */
export const getOrderByIdTool = new FunctionTool({
  name: 'get_order_by_id',
  description: 'Retrieves an order by its ID. Returns complete order details including line items, customer information, and totals.',
  parameters: z.object({
    orderId: z.string().describe('The unique identifier (ID) of the order'),
  }),
  execute: getOrderById,
});

/**
 * Tool to get orders by status.
 * Used by agents to filter orders by status (pending, confirmed, shipped, delivered, cancelled, etc.).
 */
export const getOrdersByStatusTool = new FunctionTool({
  name: 'get_orders_by_status',
  description: 'Retrieves orders filtered by status. Use this to find pending orders, shipped orders, cancelled orders, etc.',
  parameters: z.object({
    status: z.enum(['pending', 'confirmed', 'processing', 'on_hold', 'shipped', 'partially_shipped', 'delivered', 'completed', 'cancelled', 'refunded', 'partially_refunded']).describe('The order status to filter by'),
    limit: z.number().optional().describe('Maximum number of orders to return (default: all matching orders)'),
    offset: z.number().optional().describe('Number of orders to skip for pagination (default: 0)'),
  }),
  execute: getOrdersByStatus,
});

/**
 * Tool to get orders by customer ID.
 * Used by agents to find all orders for a specific customer.
 */
export const getOrdersByCustomerIdTool = new FunctionTool({
  name: 'get_orders_by_customer_id',
  description: 'Retrieves orders filtered by customer ID. Use this to find all orders placed by a specific customer.',
  parameters: z.object({
    customerId: z.string().describe('The customer ID to filter by'),
    limit: z.number().optional().describe('Maximum number of orders to return (default: all matching orders)'),
    offset: z.number().optional().describe('Number of orders to skip for pagination (default: 0)'),
  }),
  execute: getOrdersByCustomerId,
});

/**
 * Tool to get orders by customer email.
 * Used by agents to find all orders for a specific customer email.
 */
export const getOrdersByCustomerEmailTool = new FunctionTool({
  name: 'get_orders_by_customer_email',
  description: 'Retrieves orders filtered by customer email. Use this to find all orders placed by a customer using their email address.',
  parameters: z.object({
    customerEmail: z.string().describe('The customer email address to filter by'),
    limit: z.number().optional().describe('Maximum number of orders to return (default: all matching orders)'),
    offset: z.number().optional().describe('Number of orders to skip for pagination (default: 0)'),
  }),
  execute: getOrdersByCustomerEmail,
});

/**
 * Tool to get orders by payment status.
 * Used by agents to find orders with specific payment status (paid, pending, refunded, etc.).
 */
export const getOrdersByPaymentStatusTool = new FunctionTool({
  name: 'get_orders_by_payment_status',
  description: 'Retrieves orders filtered by payment status. Use this to find paid orders, pending payments, refunded orders, etc.',
  parameters: z.object({
    paymentStatus: z.enum(['pending', 'authorized', 'paid', 'partially_paid', 'partially_refunded', 'refunded', 'voided', 'failed']).describe('The payment status to filter by'),
    limit: z.number().optional().describe('Maximum number of orders to return (default: all matching orders)'),
    offset: z.number().optional().describe('Number of orders to skip for pagination (default: 0)'),
  }),
  execute: getOrdersByPaymentStatus,
});

/**
 * Tool to get orders by fulfillment status.
 * Used by agents to find orders with specific fulfillment status (fulfilled, unfulfilled, etc.).
 */
export const getOrdersByFulfillmentStatusTool = new FunctionTool({
  name: 'get_orders_by_fulfillment_status',
  description: 'Retrieves orders filtered by fulfillment status. Use this to find fulfilled orders, unfulfilled orders, partially fulfilled orders, etc.',
  parameters: z.object({
    fulfillmentStatus: z.enum(['unfulfilled', 'partially_fulfilled', 'fulfilled', 'scheduled', 'on_hold']).describe('The fulfillment status to filter by'),
    limit: z.number().optional().describe('Maximum number of orders to return (default: all matching orders)'),
    offset: z.number().optional().describe('Number of orders to skip for pagination (default: 0)'),
  }),
  execute: getOrdersByFulfillmentStatus,
});

/**
 * Tool to get orders by date range.
 * Used by agents to find orders created within a specific date range.
 */
export const getOrdersByDateRangeTool = new FunctionTool({
  name: 'get_orders_by_date_range',
  description: 'Retrieves orders filtered by date range. Use this to find orders created between startDate and endDate.',
  parameters: z.object({
    startDate: z.string().optional().describe('Start date in ISO format (e.g., 2024-01-01T00:00:00Z). Orders created before this date will be excluded.'),
    endDate: z.string().optional().describe('End date in ISO format (e.g., 2024-12-31T23:59:59Z). Orders created after this date will be excluded.'),
    limit: z.number().optional().describe('Maximum number of orders to return (default: all matching orders)'),
    offset: z.number().optional().describe('Number of orders to skip for pagination (default: 0)'),
  }),
  execute: getOrdersByDateRange,
});

/**
 * Tool to search orders.
 * Used by agents to search orders by order number, customer email, or customer name.
 */
export const searchOrdersTool = new FunctionTool({
  name: 'search_orders',
  description: 'Searches orders by order number, customer email, or customer name. Use this when user asks to find orders by search query.',
  parameters: z.object({
    query: z.string().describe('The search query to match against order numbers, customer emails, and customer names'),
    limit: z.number().optional().describe('Maximum number of orders to return (default: all matching orders)'),
    offset: z.number().optional().describe('Number of orders to skip for pagination (default: 0)'),
  }),
  execute: searchOrders,
});

/**
 * Tool to get order notes.
 * Used by agents to retrieve all notes associated with an order.
 */
export const getOrderNotesTool = new FunctionTool({
  name: 'get_order_notes',
  description: 'Retrieves all notes for an order. Use this to see order history, comments, and internal notes.',
  parameters: z.object({
    orderNumber: z.string().describe('The order number (e.g., ORD-1001) to get notes for'),
  }),
  execute: getOrderNotes,
});

/**
 * Tool to add order note.
 * Used by agents to add a note to an order.
 */
export const addOrderNoteTool = new FunctionTool({
  name: 'add_order_note',
  description: 'Adds a note to an order. Use this to record comments, updates, or internal notes about an order.',
  parameters: z.object({
    orderNumber: z.string().describe('The order number (e.g., ORD-1001) to add a note to'),
    content: z.string().describe('The content of the note'),
    isPrivate: z.boolean().optional().describe('Whether the note is private (default: false)'),
  }),
  execute: addOrderNote,
});

/**
 * Tool to get order shipments.
 * Used by agents to retrieve all shipments for an order.
 */
export const getOrderShipmentsTool = new FunctionTool({
  name: 'get_order_shipments',
  description: 'Retrieves all shipments for an order. Use this to see shipping information, tracking numbers, and shipment status.',
  parameters: z.object({
    orderNumber: z.string().describe('The order number (e.g., ORD-1001) to get shipments for'),
  }),
  execute: getOrderShipments,
});

/**
 * Tool to get order refunds.
 * Used by agents to retrieve all refunds for an order.
 */
export const getOrderRefundsTool = new FunctionTool({
  name: 'get_order_refunds',
  description: 'Retrieves all refunds for an order. Use this to see refund history, refund amounts, and refund reasons.',
  parameters: z.object({
    orderNumber: z.string().describe('The order number (e.g., ORD-1001) to get refunds for'),
  }),
  execute: getOrderRefunds,
});

/**
 * Tool to get order transactions.
 * Used by agents to retrieve all payment transactions for an order.
 */
export const getOrderTransactionsTool = new FunctionTool({
  name: 'get_order_transactions',
  description: 'Retrieves all payment transactions for an order. Use this to see payment history, authorizations, captures, and refunds.',
  parameters: z.object({
    orderNumber: z.string().describe('The order number (e.g., ORD-1001) to get transactions for'),
  }),
  execute: getOrderTransactions,
});

/**
 * Tool to update order shipping address.
 * Used by agents to change the shipping address of an order.
 */
export const updateOrderShippingAddressTool = new FunctionTool({
  name: 'update_order_shipping_address',
  description: 'Updates the shipping address of an order. Use this when customer needs to change their shipping address.',
  parameters: z.object({
    orderNumber: z.string().describe('The order number (e.g., ORD-1001) to update'),
    shippingAddress: z.object({
      firstName: z.string(),
      lastName: z.string(),
      company: z.string().optional(),
      address1: z.string(),
      address2: z.string().optional(),
      city: z.string(),
      state: z.string(),
      postalCode: z.string(),
      country: z.string(),
      phone: z.string().optional(),
      email: z.string().optional(),
    }).describe('The new shipping address'),
  }),
  execute: updateOrderShippingAddress,
});

/**
 * Tool to update order billing address.
 * Used by agents to change the billing address of an order.
 */
export const updateOrderBillingAddressTool = new FunctionTool({
  name: 'update_order_billing_address',
  description: 'Updates the billing address of an order. Use this when customer needs to change their billing address.',
  parameters: z.object({
    orderNumber: z.string().describe('The order number (e.g., ORD-1001) to update'),
    billingAddress: z.object({
      firstName: z.string(),
      lastName: z.string(),
      company: z.string().optional(),
      address1: z.string(),
      address2: z.string().optional(),
      city: z.string(),
      state: z.string(),
      postalCode: z.string(),
      country: z.string(),
      phone: z.string().optional(),
      email: z.string().optional(),
    }).describe('The new billing address'),
  }),
  execute: updateOrderBillingAddress,
});

/**
 * Tool to archive an order (SAFE replacement for delete).
 * Used by agents to safely remove orders from active view while preserving data for audit trail.
 * IMPORTANT: DELETE operations are DANGEROUS and NOT ALLOWED. Use archive instead.
 */
export const archiveOrderTool = new FunctionTool({
  name: 'archive_order',
  description: 'Archives an order by adding an archive tag. This is a SAFE replacement for delete - preserves all order data for audit trail, legal compliance, and financial records. The order can be unarchived later if needed. IMPORTANT: DELETE operations are DANGEROUS and NOT ALLOWED. Always use archive instead of delete.',
  parameters: z.object({
    orderNumber: z.string().describe('The order number (e.g., ORD-1001) to archive'),
  }),
  execute: archiveOrder,
});

/**
 * Tool to unarchive an order.
 * Used by agents to restore archived orders back to active view.
 */
export const unarchiveOrderTool = new FunctionTool({
  name: 'unarchive_order',
  description: 'Unarchives an order by removing the archive tag. Use this to recover orders that were previously archived.',
  parameters: z.object({
    orderNumber: z.string().describe('The order number (e.g., ORD-1001) to unarchive'),
  }),
  execute: unarchiveOrder,
});

