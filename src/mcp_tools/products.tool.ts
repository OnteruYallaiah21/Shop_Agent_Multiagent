/**
 * Products Tool - ADK Function Tool for Product Operations
 * 
 * Developer: Yallaiah onter
 * Email: yallaiah.ai.enginner@gmail.com
 * 
 * This tool provides operations for reading and updating products in the e-commerce system.
 * All operations interact with the JSON-based data storage (products.json).
 */

import { FunctionTool } from '@google/adk';
import { z } from 'zod';
import { Storage, enableDynamicMode } from '../utils/storage';

// Product and Variant interfaces based on the data structure
interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  barcode?: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  costPrice?: number;
  weight?: number;
  weightUnit?: string;
  options?: Record<string, string>;
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  status: string;
  type: string;
  vendor?: string;
  brand?: string;
  tags?: string[];
  categoryIds?: string[];
  images?: Array<{
    id: string;
    url: string;
    altText?: string;
    position?: number;
    isPrimary?: boolean;
  }>;
  variants: ProductVariant[];
  seoTitle?: string;
  seoDescription?: string;
  isGiftCard?: boolean;
  requiresShipping?: boolean;
  isTaxable?: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

// Enable dynamic mode for data operations (uses data/dynamic instead of data/seed)
enableDynamicMode();

// Initialize storage for products
const productsStorage = new Storage<Product>('products');

// ============================================================================
// Get Product By SKU Tool Logic Start Here
// ============================================================================

/**
 * Retrieves a product variant by its SKU.
 * 
 * @param args - Object containing sku
 * @returns Product and variant details or error message
 */
function getProductBySku(args: { sku: string }): {
  status: string;
  product?: Product;
  variant?: ProductVariant;
  error_message?: string;
} {
  try {
    const products = productsStorage.getAll();
    
    // Find product that contains the SKU in its variants
    for (const product of products) {
      const variant = product.variants.find((v) => v.sku === args.sku);
      if (variant) {
        return {
          status: 'success',
          product: product,
          variant: variant,
        };
      }
    }

    return {
      status: 'error',
      error_message: `Product with SKU ${args.sku} not found`,
    };
  } catch (error) {
    return {
      status: 'error',
      error_message: `Failed to retrieve product: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// ============================================================================
// Get Product By SKU Tool Logic End Here
// ============================================================================

// ============================================================================
// Update Product Price Tool Logic Start Here
// ============================================================================

/**
 * Updates the price of a product variant by SKU.
 * 
 * @param args - Object containing sku and newPrice
 * @returns Updated product and variant or error message
 */
function updateProductPrice(args: { sku: string; newPrice: number }): {
  status: string;
  product?: Product;
  variant?: ProductVariant;
  oldPrice?: number;
  newPrice?: number;
  error_message?: string;
} {
  try {
    // Validate price
    if (args.newPrice < 0) {
      return {
        status: 'error',
        error_message: 'Price cannot be negative',
      };
    }

    const products = productsStorage.getAll();
    let productFound = false;
    let variantFound = false;

    // Find and update the variant
    for (let i = 0; i < products.length; i++) {
      const variantIndex = products[i].variants.findIndex((v) => v.sku === args.sku);
      if (variantIndex !== -1) {
        productFound = true;
        variantFound = true;
        const oldPrice = products[i].variants[variantIndex].price;
        
        // Update variant price
        products[i].variants[variantIndex].price = args.newPrice;
        products[i].variants[variantIndex].updatedAt = new Date().toISOString();
        products[i].updatedAt = new Date().toISOString();

        // Save updated product
        const updatedProduct = productsStorage.update(products[i].id, products[i]);
        
        if (!updatedProduct) {
          return {
            status: 'error',
            error_message: `Failed to update product price for SKU ${args.sku}`,
          };
        }

        return {
          status: 'success',
          product: updatedProduct,
          variant: updatedProduct.variants[variantIndex],
          oldPrice: oldPrice,
          newPrice: args.newPrice,
        };
      }
    }

    if (!productFound) {
      return {
        status: 'error',
        error_message: `Product with SKU ${args.sku} not found`,
      };
    }

    return {
      status: 'error',
      error_message: `Variant with SKU ${args.sku} not found`,
    };
  } catch (error) {
    return {
      status: 'error',
      error_message: `Failed to update product price: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// ============================================================================
// Update Product Price Tool Logic End Here
// ============================================================================

// ============================================================================
// Update Product Description Tool Logic Start Here
// ============================================================================

/**
 * Updates the description of a product.
 * 
 * @param args - Object containing sku and newDescription
 * @returns Updated product or error message
 */
function updateProductDescription(args: { sku: string; newDescription: string }): {
  status: string;
  product?: Product;
  oldDescription?: string;
  newDescription?: string;
  error_message?: string;
} {
  try {
    // Validate description length
    if (args.newDescription.length > 5000) {
      return {
        status: 'error',
        error_message: 'Description cannot exceed 5000 characters',
      };
    }

    const products = productsStorage.getAll();
    let productFound = false;

    // Find product by SKU (any variant)
    for (let i = 0; i < products.length; i++) {
      const variant = products[i].variants.find((v) => v.sku === args.sku);
      if (variant) {
        productFound = true;
        const oldDescription = products[i].description;
        
        // Update product description
        products[i].description = args.newDescription;
        products[i].updatedAt = new Date().toISOString();

        // Save updated product
        const updatedProduct = productsStorage.update(products[i].id, products[i]);
        
        if (!updatedProduct) {
          return {
            status: 'error',
            error_message: `Failed to update product description for SKU ${args.sku}`,
          };
        }

        return {
          status: 'success',
          product: updatedProduct,
          oldDescription: oldDescription,
          newDescription: args.newDescription,
        };
      }
    }

    if (!productFound) {
      return {
        status: 'error',
        error_message: `Product with SKU ${args.sku} not found`,
      };
    }

    return {
      status: 'error',
      error_message: `Failed to update product description for SKU ${args.sku}`,
    };
  } catch (error) {
    return {
      status: 'error',
      error_message: `Failed to update product description: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// ============================================================================
// Update Product Description Tool Logic End Here
// ============================================================================

// ============================================================================
// ADK Function Tools Export
// ============================================================================

/**
 * Tool to get product details by SKU.
 * Used by agents to retrieve product information including price, description, and variant details.
 */
export const getProductBySkuTool = new FunctionTool({
  name: 'get_product_by_sku',
  description: 'Retrieves a product and its variant by SKU. Returns product details including name, description, price, and variant information.',
  parameters: z.object({
    sku: z.string().describe('The SKU (Stock Keeping Unit) of the product variant (e.g., HP-BLK-001)'),
  }),
  execute: getProductBySku,
});

/**
 * Tool to update product price by SKU.
 * Used by agents to change the price of a product variant.
 */
export const updateProductPriceTool = new FunctionTool({
  name: 'update_product_price',
  description: 'Updates the price of a product variant identified by SKU. The price must be a positive number.',
  parameters: z.object({
    sku: z.string().describe('The SKU (Stock Keeping Unit) of the product variant to update (e.g., HP-BLK-001)'),
    newPrice: z.number().describe('The new price for the product variant. Must be a positive number.'),
  }),
  execute: updateProductPrice,
});

/**
 * Tool to update product description by SKU.
 * Used by agents to change the description of a product.
 */
export const updateProductDescriptionTool = new FunctionTool({
  name: 'update_product_description',
  description: 'Updates the description of a product identified by any of its variant SKUs. Description cannot exceed 5000 characters.',
  parameters: z.object({
    sku: z.string().describe('The SKU (Stock Keeping Unit) of any variant of the product to update (e.g., HP-BLK-001)'),
    newDescription: z.string().describe('The new description for the product. Maximum length is 5000 characters.'),
  }),
  execute: updateProductDescription,
});

