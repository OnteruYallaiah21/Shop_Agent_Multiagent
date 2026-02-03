/**
 * MCP Tools Index - Export all ADK Function Tools and Guards
 * 
 * Developer: Yallaiah onter
 * Email: yallaiah.ai.enginner@gmail.com
 * 
 * This file exports all available tools and guards for use in ADK agents.
 * Import this file to get access to all tools and guards in the system.
 */

// Orders tools
export {
  getOrderByOrderNumberTool,
  getOrderByIdTool,
  getAllOrdersTool,
  getOrdersByStatusTool,
  getOrdersByCustomerIdTool,
  getOrdersByCustomerEmailTool,
  getOrdersByPaymentStatusTool,
  getOrdersByFulfillmentStatusTool,
  getOrdersByDateRangeTool,
  searchOrdersTool,
  getOrderNotesTool,
  addOrderNoteTool,
  getOrderShipmentsTool,
  getOrderRefundsTool,
  getOrderTransactionsTool,
  updateOrderStatusTool,
  updateOrderShippingAddressTool,
  updateOrderBillingAddressTool,
  archiveOrderTool,
  unarchiveOrderTool,
  cancelOrderTool,
  updateOrderStatus,
  cancelOrder,
  getAllOrders,
  addOrderNote,
  updateOrderShippingAddress,
  updateOrderBillingAddress,
  archiveOrder,
  unarchiveOrder,
} from './orders.tool';

// Products tools
export {
  getProductBySkuTool,
  getProductByIdTool,
  getAllProductsTool,
  getProductsByStatusTool,
  getProductsByCategoryTool,
  getProductsByVendorTool,
  getProductsByBrandTool,
  getProductsByTagsTool,
  searchProductsTool,
  getProductsByPriceRangeTool,
  updateProductPriceTool,
  updateProductDescriptionTool,
  updateProductNameTool,
  updateProductStatusTool,
  updateProductTagsTool,
  updateVariantCompareAtPriceTool,
  updateVariantCostPriceTool,
  archiveProductTool,
  unarchiveProductTool,
  updateProductPrice,
  updateProductDescription,
  updateProductName,
  updateProductStatus,
  updateProductTags,
  updateVariantCompareAtPrice,
  updateVariantCostPrice,
  archiveProduct,
  unarchiveProduct,
  getAllProducts,
} from './products.tool';

// Promotions tools
export {
  getPromotionByIdTool,
  getAllPromotionsTool,
  activatePromotionTool,
  deactivatePromotionTool,
  getPromotionUsageTool,
  getAllPromotions,
} from './promotions.tool';

// Validation guards
export {
  validateSkuExists,
  validateOrderExists,
  validatePrice,
  validateDescription,
  validateProductActive,
  validatePriceVsCost,
  validateProductUpdate,
  validateOrderOperation,
  validateSlug,
  validateSkuFormat,
  validateCompareAtPrice,
  type ValidationResult,
  type EntityValidation,
} from './validation.guard';

// Price guards
export {
  calculatePriceDeviation,
  checkPriceOutlier,
  validatePriceChange,
  getPriceOutlierConfirmationMessage,
  type PriceOutlierResult,
} from './price.guard';

// Transition guards
export {
  validateStatusTransition,
  validateOrderCancellation,
  validateOrderStatusWithPayment,
  getTransitionErrorMessage,
  type OrderStatus,
  type TransitionResult,
} from './transition.guard';

// Human confirmation guards
export {
  checkIntentConfidence,
  checkEntityCompleteness,
  checkPriceChangeConfirmation,
  checkHighRiskOperation,
  requiresHumanConfirmation,
  createConfirmationState,
  validateConfirmationCommand,
  type ConfirmationRequest,
  type ConfirmationState,
} from './human.confirm.guard';

// Inventory guards
export {
  validateInventoryAvailability,
  validateInventoryAdjustment,
  validateInventoryReservation,
  type InventoryValidationResult,
  type InventoryLevel,
} from './inventory.guard';

// Promotion guards
export {
  validatePromotionActivation,
  validatePromotionDeactivation,
  validatePromotionEligibility,
  validatePromotionValue,
  type PromotionValidationResult,
  type Promotion,
} from './promotion.guard';

