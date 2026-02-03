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
// Get Product By ID Tool Logic Start Here
// ============================================================================

/**
 * Retrieves a product by its ID.
 * 
 * @param args - Object containing productId
 * @returns Product details or error message
 */
function getProductById(args: { productId: string }): {
  status: string;
  product?: Product;
  error_message?: string;
} {
  try {
    const product = productsStorage.getById(args.productId);
    
    if (!product) {
      return {
        status: 'error',
        error_message: `Product with ID ${args.productId} not found`,
      };
    }

    return {
      status: 'success',
      product: product,
    };
  } catch (error) {
    return {
      status: 'error',
      error_message: `Failed to retrieve product: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// ============================================================================
// Get Product By ID Tool Logic End Here
// ============================================================================

// ============================================================================
// Get All Products Tool Logic Start Here
// ============================================================================

/**
 * Retrieves all products in the system.
 * 
 * @param args - Optional object with limit and offset for pagination
 * @returns List of all products or error message
 */
function getAllProducts(args?: { limit?: number; offset?: number }): {
  status: string;
  products?: Product[];
  total?: number;
  limit?: number;
  offset?: number;
  error_message?: string;
} {
  try {
    console.log(`[getAllProducts] Starting to retrieve products...`);
    const products = productsStorage.getAll();
    console.log(`[getAllProducts] Retrieved ${products.length} products from storage`);
    
    // Log first product for debugging
    if (products.length > 0) {
      console.log(`[getAllProducts] First product: ${products[0].name} (SKU: ${products[0].variants?.[0]?.sku || 'N/A'})`);
    } else {
      console.warn(`[getAllProducts] ⚠️ No products found in storage!`);
      console.warn(`[getAllProducts] Storage file path: ${(productsStorage as any).filePath || 'unknown'}`);
    }
    
    // Apply pagination if provided
    const limit = args?.limit || products.length;
    const offset = args?.offset || 0;
    const paginatedProducts = products.slice(offset, offset + limit);

    console.log(`[getAllProducts] Returning ${paginatedProducts.length} products (total: ${products.length}, limit: ${limit}, offset: ${offset})`);

    return {
      status: 'success',
      products: paginatedProducts,
      total: products.length,
      limit: limit,
      offset: offset,
    };
  } catch (error) {
    console.error(`[getAllProducts] ❌ Error retrieving products:`, error);
    return {
      status: 'error',
      error_message: `Failed to retrieve products: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// ============================================================================
// Get All Products Tool Logic End Here
// ============================================================================

// ============================================================================
// Get Products By Status Tool Logic Start Here
// ============================================================================

/**
 * Retrieves products filtered by status.
 * 
 * @param args - Object containing status and optional pagination
 * @returns List of products with matching status
 */
function getProductsByStatus(args: { status: string; limit?: number; offset?: number }): {
  status: string;
  products?: Product[];
  total?: number;
  error_message?: string;
} {
  try {
    const products = productsStorage.getAll();
    const filtered = products.filter((p) => p.status === args.status);
    
    const limit = args.limit || filtered.length;
    const offset = args.offset || 0;
    const paginated = filtered.slice(offset, offset + limit);

    return {
      status: 'success',
      products: paginated,
      total: filtered.length,
    };
  } catch (error) {
    return {
      status: 'error',
      error_message: `Failed to retrieve products: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// ============================================================================
// Get Products By Status Tool Logic End Here
// ============================================================================

// ============================================================================
// Get Products By Category Tool Logic Start Here
// ============================================================================

/**
 * Retrieves products filtered by category ID.
 * 
 * @param args - Object containing categoryId and optional pagination
 * @returns List of products in the category
 */
function getProductsByCategory(args: { categoryId: string; limit?: number; offset?: number }): {
  status: string;
  products?: Product[];
  total?: number;
  error_message?: string;
} {
  try {
    const products = productsStorage.getAll();
    const filtered = products.filter((p) => p.categoryIds?.includes(args.categoryId));
    
    const limit = args.limit || filtered.length;
    const offset = args.offset || 0;
    const paginated = filtered.slice(offset, offset + limit);

    return {
      status: 'success',
      products: paginated,
      total: filtered.length,
    };
  } catch (error) {
    return {
      status: 'error',
      error_message: `Failed to retrieve products: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// ============================================================================
// Get Products By Category Tool Logic End Here
// ============================================================================

// ============================================================================
// Get Products By Vendor Tool Logic Start Here
// ============================================================================

/**
 * Retrieves products filtered by vendor.
 * 
 * @param args - Object containing vendor and optional pagination
 * @returns List of products from the vendor
 */
function getProductsByVendor(args: { vendor: string; limit?: number; offset?: number }): {
  status: string;
  products?: Product[];
  total?: number;
  error_message?: string;
} {
  try {
    const products = productsStorage.getAll();
    const filtered = products.filter((p) => p.vendor === args.vendor);
    
    const limit = args.limit || filtered.length;
    const offset = args.offset || 0;
    const paginated = filtered.slice(offset, offset + limit);

    return {
      status: 'success',
      products: paginated,
      total: filtered.length,
    };
  } catch (error) {
    return {
      status: 'error',
      error_message: `Failed to retrieve products: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// ============================================================================
// Get Products By Vendor Tool Logic End Here
// ============================================================================

// ============================================================================
// Get Products By Brand Tool Logic Start Here
// ============================================================================

/**
 * Retrieves products filtered by brand.
 * 
 * @param args - Object containing brand and optional pagination
 * @returns List of products from the brand
 */
function getProductsByBrand(args: { brand: string; limit?: number; offset?: number }): {
  status: string;
  products?: Product[];
  total?: number;
  error_message?: string;
} {
  try {
    const products = productsStorage.getAll();
    const filtered = products.filter((p) => p.brand === args.brand);
    
    const limit = args.limit || filtered.length;
    const offset = args.offset || 0;
    const paginated = filtered.slice(offset, offset + limit);

    return {
      status: 'success',
      products: paginated,
      total: filtered.length,
    };
  } catch (error) {
    return {
      status: 'error',
      error_message: `Failed to retrieve products: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// ============================================================================
// Get Products By Brand Tool Logic End Here
// ============================================================================

// ============================================================================
// Get Products By Tags Tool Logic Start Here
// ============================================================================

/**
 * Retrieves products filtered by tags.
 * 
 * @param args - Object containing tags array and optional pagination
 * @returns List of products with matching tags
 */
function getProductsByTags(args: { tags: string[]; limit?: number; offset?: number }): {
  status: string;
  products?: Product[];
  total?: number;
  error_message?: string;
} {
  try {
    const products = productsStorage.getAll();
    const filtered = products.filter((p) => 
      args.tags.some((tag) => p.tags?.includes(tag))
    );
    
    const limit = args.limit || filtered.length;
    const offset = args.offset || 0;
    const paginated = filtered.slice(offset, offset + limit);

    return {
      status: 'success',
      products: paginated,
      total: filtered.length,
    };
  } catch (error) {
    return {
      status: 'error',
      error_message: `Failed to retrieve products: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// ============================================================================
// Get Products By Tags Tool Logic End Here
// ============================================================================

// ============================================================================
// Search Products Tool Logic Start Here
// ============================================================================

/**
 * Searches products by name or description.
 * 
 * @param args - Object containing search query and optional pagination
 * @returns List of products matching the search
 */
function searchProducts(args: { query: string; limit?: number; offset?: number }): {
  status: string;
  products?: Product[];
  total?: number;
  error_message?: string;
} {
  try {
    const products = productsStorage.getAll();
    const query = args.query.toLowerCase();
    const filtered = products.filter((p) => 
      p.name.toLowerCase().includes(query) || 
      p.description.toLowerCase().includes(query) ||
      p.shortDescription?.toLowerCase().includes(query)
    );
    
    const limit = args.limit || filtered.length;
    const offset = args.offset || 0;
    const paginated = filtered.slice(offset, offset + limit);

    return {
      status: 'success',
      products: paginated,
      total: filtered.length,
    };
  } catch (error) {
    return {
      status: 'error',
      error_message: `Failed to search products: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// ============================================================================
// Search Products Tool Logic End Here
// ============================================================================

// ============================================================================
// Get Products By Price Range Tool Logic Start Here
// ============================================================================

/**
 * Retrieves products filtered by price range.
 * 
 * @param args - Object containing minPrice and/or maxPrice, and optional pagination
 * @returns List of products within the price range
 */
function getProductsByPriceRange(args: { minPrice?: number; maxPrice?: number; limit?: number; offset?: number }): {
  status: string;
  products?: Product[];
  total?: number;
  error_message?: string;
} {
  try {
    const products = productsStorage.getAll();
    const filtered = products.filter((p) => {
      const minPrice = p.variants.reduce((min, v) => Math.min(min, v.price), Infinity);
      const maxPrice = p.variants.reduce((max, v) => Math.max(max, v.price), 0);
      
      if (args.minPrice !== undefined && maxPrice < args.minPrice) return false;
      if (args.maxPrice !== undefined && minPrice > args.maxPrice) return false;
      return true;
    });
    
    const limit = args.limit || filtered.length;
    const offset = args.offset || 0;
    const paginated = filtered.slice(offset, offset + limit);

    return {
      status: 'success',
      products: paginated,
      total: filtered.length,
    };
  } catch (error) {
    return {
      status: 'error',
      error_message: `Failed to retrieve products: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// ============================================================================
// Get Products By Price Range Tool Logic End Here
// ============================================================================

// Export the underlying function for direct use
export { getAllProducts };

// ============================================================================
// Update Product Price Tool Logic Start Here
// ============================================================================

/**
 * Updates the price of a product variant by SKU.
 * 
 * @param args - Object containing sku and newPrice
 * @returns Updated product and variant or error message
 */
export function updateProductPrice(args: { sku: string; newPrice: number }): {
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
export function updateProductDescription(args: { sku: string; newDescription: string }): {
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
// Update Product Name Tool Logic Start Here
// ============================================================================

/**
 * Updates the name of a product.
 * 
 * @param args - Object containing sku and newName
 * @returns Updated product or error message
 */
export function updateProductName(args: { sku: string; newName: string }): {
  status: string;
  product?: Product;
  oldName?: string;
  newName?: string;
  error_message?: string;
} {
  try {
    if (!args.newName || args.newName.trim().length === 0) {
      return {
        status: 'error',
        error_message: 'Product name cannot be empty',
      };
    }

    const products = productsStorage.getAll();
    let productFound = false;

    // Find product by SKU (any variant)
    for (let i = 0; i < products.length; i++) {
      const variant = products[i].variants.find((v) => v.sku === args.sku);
      if (variant) {
        productFound = true;
        const oldName = products[i].name;
        
        // Update product name
        products[i].name = args.newName;
        products[i].updatedAt = new Date().toISOString();

        // Save updated product
        const updatedProduct = productsStorage.update(products[i].id, products[i]);
        
        if (!updatedProduct) {
          return {
            status: 'error',
            error_message: `Failed to update product name for SKU ${args.sku}`,
          };
        }

        return {
          status: 'success',
          product: updatedProduct,
          oldName: oldName,
          newName: args.newName,
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
      error_message: `Failed to update product name for SKU ${args.sku}`,
    };
  } catch (error) {
    return {
      status: 'error',
      error_message: `Failed to update product name: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// ============================================================================
// Update Product Name Tool Logic End Here
// ============================================================================

// ============================================================================
// Update Product Status Tool Logic Start Here
// ============================================================================

/**
 * Updates the status of a product.
 * 
 * @param args - Object containing sku and newStatus
 * @returns Updated product or error message
 */
export function updateProductStatus(args: { sku: string; newStatus: string }): {
  status: string;
  product?: Product;
  oldStatus?: string;
  newStatus?: string;
  error_message?: string;
} {
  try {
    const validStatuses = ['active', 'draft', 'archived', 'discontinued'];
    if (!validStatuses.includes(args.newStatus)) {
      return {
        status: 'error',
        error_message: `Invalid status. Valid statuses are: ${validStatuses.join(', ')}`,
      };
    }

    const products = productsStorage.getAll();
    let productFound = false;

    // Find product by SKU (any variant)
    for (let i = 0; i < products.length; i++) {
      const variant = products[i].variants.find((v) => v.sku === args.sku);
      if (variant) {
        productFound = true;
        const oldStatus = products[i].status;
        
        // Update product status
        products[i].status = args.newStatus;
        products[i].updatedAt = new Date().toISOString();
        
        // Set publishedAt if status is active
        if (args.newStatus === 'active' && !products[i].publishedAt) {
          products[i].publishedAt = new Date().toISOString();
        }

        // Save updated product
        const updatedProduct = productsStorage.update(products[i].id, products[i]);
        
        if (!updatedProduct) {
          return {
            status: 'error',
            error_message: `Failed to update product status for SKU ${args.sku}`,
          };
        }

        return {
          status: 'success',
          product: updatedProduct,
          oldStatus: oldStatus,
          newStatus: args.newStatus,
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
      error_message: `Failed to update product status for SKU ${args.sku}`,
    };
  } catch (error) {
    return {
      status: 'error',
      error_message: `Failed to update product status: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// ============================================================================
// Update Product Status Tool Logic End Here
// ============================================================================

// ============================================================================
// Update Product Tags Tool Logic Start Here
// ============================================================================

/**
 * Updates the tags of a product.
 * 
 * @param args - Object containing sku and tags array
 * @returns Updated product or error message
 */
export function updateProductTags(args: { sku: string; tags: string[] }): {
  status: string;
  product?: Product;
  oldTags?: string[];
  newTags?: string[];
  error_message?: string;
} {
  try {
    const products = productsStorage.getAll();
    let productFound = false;

    // Find product by SKU (any variant)
    for (let i = 0; i < products.length; i++) {
      const variant = products[i].variants.find((v) => v.sku === args.sku);
      if (variant) {
        productFound = true;
        const oldTags = products[i].tags || [];
        
        // Update product tags
        products[i].tags = args.tags;
        products[i].updatedAt = new Date().toISOString();

        // Save updated product
        const updatedProduct = productsStorage.update(products[i].id, products[i]);
        
        if (!updatedProduct) {
          return {
            status: 'error',
            error_message: `Failed to update product tags for SKU ${args.sku}`,
          };
        }

        return {
          status: 'success',
          product: updatedProduct,
          oldTags: oldTags,
          newTags: args.tags,
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
      error_message: `Failed to update product tags for SKU ${args.sku}`,
    };
  } catch (error) {
    return {
      status: 'error',
      error_message: `Failed to update product tags: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// ============================================================================
// Update Product Tags Tool Logic End Here
// ============================================================================

// ============================================================================
// Update Variant Compare At Price Tool Logic Start Here
// ============================================================================

/**
 * Updates the compareAtPrice of a product variant by SKU.
 * 
 * @param args - Object containing sku and compareAtPrice
 * @returns Updated product and variant or error message
 */
export function updateVariantCompareAtPrice(args: { sku: string; compareAtPrice?: number }): {
  status: string;
  product?: Product;
  variant?: ProductVariant;
  oldCompareAtPrice?: number;
  newCompareAtPrice?: number;
  error_message?: string;
} {
  try {
    const products = productsStorage.getAll();
    let productFound = false;
    let variantFound = false;

    // Find and update the variant
    for (let i = 0; i < products.length; i++) {
      const variantIndex = products[i].variants.findIndex((v) => v.sku === args.sku);
      if (variantIndex !== -1) {
        productFound = true;
        variantFound = true;
        const oldCompareAtPrice = products[i].variants[variantIndex].compareAtPrice;
        
        // Update variant compareAtPrice
        products[i].variants[variantIndex].compareAtPrice = args.compareAtPrice;
        products[i].variants[variantIndex].updatedAt = new Date().toISOString();
        products[i].updatedAt = new Date().toISOString();

        // Save updated product
        const updatedProduct = productsStorage.update(products[i].id, products[i]);
        
        if (!updatedProduct) {
          return {
            status: 'error',
            error_message: `Failed to update variant compareAtPrice for SKU ${args.sku}`,
          };
        }

        return {
          status: 'success',
          product: updatedProduct,
          variant: updatedProduct.variants[variantIndex],
          oldCompareAtPrice: oldCompareAtPrice,
          newCompareAtPrice: args.compareAtPrice,
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
      error_message: `Failed to update variant compareAtPrice: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// ============================================================================
// Update Variant Compare At Price Tool Logic End Here
// ============================================================================

// ============================================================================
// Update Variant Cost Price Tool Logic Start Here
// ============================================================================

/**
 * Updates the costPrice of a product variant by SKU.
 * 
 * @param args - Object containing sku and costPrice
 * @returns Updated product and variant or error message
 */
export function updateVariantCostPrice(args: { sku: string; costPrice?: number }): {
  status: string;
  product?: Product;
  variant?: ProductVariant;
  oldCostPrice?: number;
  newCostPrice?: number;
  error_message?: string;
} {
  try {
    const products = productsStorage.getAll();
    let productFound = false;
    let variantFound = false;

    // Find and update the variant
    for (let i = 0; i < products.length; i++) {
      const variantIndex = products[i].variants.findIndex((v) => v.sku === args.sku);
      if (variantIndex !== -1) {
        productFound = true;
        variantFound = true;
        const oldCostPrice = products[i].variants[variantIndex].costPrice;
        
        // Update variant costPrice
        products[i].variants[variantIndex].costPrice = args.costPrice;
        products[i].variants[variantIndex].updatedAt = new Date().toISOString();
        products[i].updatedAt = new Date().toISOString();

        // Save updated product
        const updatedProduct = productsStorage.update(products[i].id, products[i]);
        
        if (!updatedProduct) {
          return {
            status: 'error',
            error_message: `Failed to update variant costPrice for SKU ${args.sku}`,
          };
        }

        return {
          status: 'success',
          product: updatedProduct,
          variant: updatedProduct.variants[variantIndex],
          oldCostPrice: oldCostPrice,
          newCostPrice: args.costPrice,
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
      error_message: `Failed to update variant costPrice: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// ============================================================================
// Update Variant Cost Price Tool Logic End Here
// ============================================================================

// ============================================================================
// Archive Product Tool Logic Start Here
// ============================================================================

/**
 * Archives a product by setting its status to 'archived'.
 * This is a SAFE replacement for delete - preserves data for audit trail.
 * 
 * @param args - Object containing sku
 * @returns Updated product or error message
 */
export function archiveProduct(args: { sku: string }): {
  status: string;
  product?: Product;
  oldStatus?: string;
  newStatus?: string;
  error_message?: string;
} {
  try {
    const products = productsStorage.getAll();
    let productFound = false;

    // Find product by SKU (any variant)
    for (let i = 0; i < products.length; i++) {
      const variant = products[i].variants.find((v) => v.sku === args.sku);
      if (variant) {
        productFound = true;
        const oldStatus = products[i].status;
        
        // Archive product (set status to archived)
        products[i].status = 'archived';
        products[i].updatedAt = new Date().toISOString();

        // Save updated product
        const updatedProduct = productsStorage.update(products[i].id, products[i]);
        
        if (!updatedProduct) {
          return {
            status: 'error',
            error_message: `Failed to archive product for SKU ${args.sku}`,
          };
        }

        return {
          status: 'success',
          product: updatedProduct,
          oldStatus: oldStatus,
          newStatus: 'archived',
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
      error_message: `Failed to archive product for SKU ${args.sku}`,
    };
  } catch (error) {
    return {
      status: 'error',
      error_message: `Failed to archive product: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Unarchives a product by setting its status back to 'active' or 'draft'.
 * This allows recovery of archived products.
 * 
 * @param args - Object containing sku and optional targetStatus
 * @returns Updated product or error message
 */
export function unarchiveProduct(args: { sku: string; targetStatus?: 'active' | 'draft' }): {
  status: string;
  product?: Product;
  oldStatus?: string;
  newStatus?: string;
  error_message?: string;
} {
  try {
    const products = productsStorage.getAll();
    let productFound = false;

    // Find product by SKU (any variant)
    for (let i = 0; i < products.length; i++) {
      const variant = products[i].variants.find((v) => v.sku === args.sku);
      if (variant) {
        productFound = true;
        
        if (products[i].status !== 'archived') {
          return {
            status: 'error',
            error_message: `Product with SKU ${args.sku} is not archived. Current status: ${products[i].status}`,
          };
        }

        const oldStatus = products[i].status;
        const targetStatus = args.targetStatus || 'active';
        
        // Unarchive product
        products[i].status = targetStatus;
        products[i].updatedAt = new Date().toISOString();
        
        // Set publishedAt if activating
        if (targetStatus === 'active' && !products[i].publishedAt) {
          products[i].publishedAt = new Date().toISOString();
        }

        // Save updated product
        const updatedProduct = productsStorage.update(products[i].id, products[i]);
        
        if (!updatedProduct) {
          return {
            status: 'error',
            error_message: `Failed to unarchive product for SKU ${args.sku}`,
          };
        }

        return {
          status: 'success',
          product: updatedProduct,
          oldStatus: oldStatus,
          newStatus: targetStatus,
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
      error_message: `Failed to unarchive product for SKU ${args.sku}`,
    };
  } catch (error) {
    return {
      status: 'error',
      error_message: `Failed to unarchive product: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// ============================================================================
// Archive Product Tool Logic End Here
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
 * Tool to get product details by ID.
 * Used by agents to retrieve product information by product ID.
 */
export const getProductByIdTool = new FunctionTool({
  name: 'get_product_by_id',
  description: 'Retrieves a product by its ID. Returns complete product details including all variants, images, and metadata.',
  parameters: z.object({
    productId: z.string().describe('The unique identifier (ID) of the product'),
  }),
  execute: getProductById,
});

/**
 * Tool to get all products in the system.
 * Used by agents to list all available products when user asks "what products do you have" or similar queries.
 */
export const getAllProductsTool = new FunctionTool({
  name: 'get_all_products',
  description: 'Retrieves all products in the system. Use this when user asks "what products do you have", "show me all products", "list products", etc. Returns a list of all products with their details including name, description, price, and variants. Optional pagination parameters (limit, offset) can be provided.',
  parameters: z.object({
    limit: z.number().optional().describe('Maximum number of products to return (default: all products)'),
    offset: z.number().optional().describe('Number of products to skip for pagination (default: 0)'),
  }),
  execute: getAllProducts,
});

/**
 * Tool to get products by status.
 * Used by agents to filter products by status (active, draft, archived, discontinued).
 */
export const getProductsByStatusTool = new FunctionTool({
  name: 'get_products_by_status',
  description: 'Retrieves products filtered by status. Use this to find active products, draft products, archived products, or discontinued products.',
  parameters: z.object({
    status: z.enum(['active', 'draft', 'archived', 'discontinued']).describe('The product status to filter by'),
    limit: z.number().optional().describe('Maximum number of products to return (default: all matching products)'),
    offset: z.number().optional().describe('Number of products to skip for pagination (default: 0)'),
  }),
  execute: getProductsByStatus,
});

/**
 * Tool to get products by category.
 * Used by agents to find products in a specific category.
 */
export const getProductsByCategoryTool = new FunctionTool({
  name: 'get_products_by_category',
  description: 'Retrieves products filtered by category ID. Use this to find all products in a specific category.',
  parameters: z.object({
    categoryId: z.string().describe('The category ID to filter by'),
    limit: z.number().optional().describe('Maximum number of products to return (default: all matching products)'),
    offset: z.number().optional().describe('Number of products to skip for pagination (default: 0)'),
  }),
  execute: getProductsByCategory,
});

/**
 * Tool to get products by vendor.
 * Used by agents to find products from a specific vendor.
 */
export const getProductsByVendorTool = new FunctionTool({
  name: 'get_products_by_vendor',
  description: 'Retrieves products filtered by vendor name. Use this to find all products from a specific vendor.',
  parameters: z.object({
    vendor: z.string().describe('The vendor name to filter by'),
    limit: z.number().optional().describe('Maximum number of products to return (default: all matching products)'),
    offset: z.number().optional().describe('Number of products to skip for pagination (default: 0)'),
  }),
  execute: getProductsByVendor,
});

/**
 * Tool to get products by brand.
 * Used by agents to find products from a specific brand.
 */
export const getProductsByBrandTool = new FunctionTool({
  name: 'get_products_by_brand',
  description: 'Retrieves products filtered by brand name. Use this to find all products from a specific brand.',
  parameters: z.object({
    brand: z.string().describe('The brand name to filter by'),
    limit: z.number().optional().describe('Maximum number of products to return (default: all matching products)'),
    offset: z.number().optional().describe('Number of products to skip for pagination (default: 0)'),
  }),
  execute: getProductsByBrand,
});

/**
 * Tool to get products by tags.
 * Used by agents to find products with specific tags.
 */
export const getProductsByTagsTool = new FunctionTool({
  name: 'get_products_by_tags',
  description: 'Retrieves products filtered by tags. Use this to find all products that have any of the specified tags.',
  parameters: z.object({
    tags: z.array(z.string()).describe('Array of tags to filter by. Products with any of these tags will be returned.'),
    limit: z.number().optional().describe('Maximum number of products to return (default: all matching products)'),
    offset: z.number().optional().describe('Number of products to skip for pagination (default: 0)'),
  }),
  execute: getProductsByTags,
});

/**
 * Tool to search products.
 * Used by agents to search products by name or description.
 */
export const searchProductsTool = new FunctionTool({
  name: 'search_products',
  description: 'Searches products by name or description. Use this when user asks to find products by name or searches for products.',
  parameters: z.object({
    query: z.string().describe('The search query to match against product names and descriptions'),
    limit: z.number().optional().describe('Maximum number of products to return (default: all matching products)'),
    offset: z.number().optional().describe('Number of products to skip for pagination (default: 0)'),
  }),
  execute: searchProducts,
});

/**
 * Tool to get products by price range.
 * Used by agents to find products within a specific price range.
 */
export const getProductsByPriceRangeTool = new FunctionTool({
  name: 'get_products_by_price_range',
  description: 'Retrieves products filtered by price range. Use this to find products within a minimum and/or maximum price.',
  parameters: z.object({
    minPrice: z.number().optional().describe('Minimum price (products with variants below this price will be excluded)'),
    maxPrice: z.number().optional().describe('Maximum price (products with variants above this price will be excluded)'),
    limit: z.number().optional().describe('Maximum number of products to return (default: all matching products)'),
    offset: z.number().optional().describe('Number of products to skip for pagination (default: 0)'),
  }),
  execute: getProductsByPriceRange,
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

/**
 * Tool to update product name by SKU.
 * Used by agents to change the name of a product.
 */
export const updateProductNameTool = new FunctionTool({
  name: 'update_product_name',
  description: 'Updates the name of a product identified by any of its variant SKUs.',
  parameters: z.object({
    sku: z.string().describe('The SKU (Stock Keeping Unit) of any variant of the product to update (e.g., HP-BLK-001)'),
    newName: z.string().describe('The new name for the product. Cannot be empty.'),
  }),
  execute: updateProductName,
});

/**
 * Tool to update product status by SKU.
 * Used by agents to change the status of a product (active, draft, archived, discontinued).
 */
export const updateProductStatusTool = new FunctionTool({
  name: 'update_product_status',
  description: 'Updates the status of a product identified by any of its variant SKUs. Valid statuses: active, draft, archived, discontinued.',
  parameters: z.object({
    sku: z.string().describe('The SKU (Stock Keeping Unit) of any variant of the product to update (e.g., HP-BLK-001)'),
    newStatus: z.enum(['active', 'draft', 'archived', 'discontinued']).describe('The new status for the product'),
  }),
  execute: updateProductStatus,
});

/**
 * Tool to update product tags by SKU.
 * Used by agents to change the tags of a product.
 */
export const updateProductTagsTool = new FunctionTool({
  name: 'update_product_tags',
  description: 'Updates the tags of a product identified by any of its variant SKUs. Replaces all existing tags with the new tags array.',
  parameters: z.object({
    sku: z.string().describe('The SKU (Stock Keeping Unit) of any variant of the product to update (e.g., HP-BLK-001)'),
    tags: z.array(z.string()).describe('Array of tags to set for the product. This replaces all existing tags.'),
  }),
  execute: updateProductTags,
});

/**
 * Tool to update variant compareAtPrice by SKU.
 * Used by agents to change the compareAtPrice (original price) of a product variant.
 */
export const updateVariantCompareAtPriceTool = new FunctionTool({
  name: 'update_variant_compare_at_price',
  description: 'Updates the compareAtPrice (original/compare price) of a product variant identified by SKU. This is typically used to show a "was" price when the product is on sale.',
  parameters: z.object({
    sku: z.string().describe('The SKU (Stock Keeping Unit) of the product variant to update (e.g., HP-BLK-001)'),
    compareAtPrice: z.number().optional().describe('The new compareAtPrice. Set to undefined or omit to remove the compareAtPrice.'),
  }),
  execute: updateVariantCompareAtPrice,
});

/**
 * Tool to update variant costPrice by SKU.
 * Used by agents to change the costPrice (cost of goods) of a product variant.
 */
export const updateVariantCostPriceTool = new FunctionTool({
  name: 'update_variant_cost_price',
  description: 'Updates the costPrice (cost of goods) of a product variant identified by SKU. This is used for profit margin calculations.',
  parameters: z.object({
    sku: z.string().describe('The SKU (Stock Keeping Unit) of the product variant to update (e.g., HP-BLK-001)'),
    costPrice: z.number().optional().describe('The new costPrice. Set to undefined or omit to remove the costPrice.'),
  }),
  execute: updateVariantCostPrice,
});

/**
 * Tool to archive a product (SAFE replacement for delete).
 * Used by agents to safely remove products from active use while preserving data for audit trail.
 * IMPORTANT: DELETE operations are DANGEROUS and NOT ALLOWED. Use archive instead.
 */
export const archiveProductTool = new FunctionTool({
  name: 'archive_product',
  description: 'Archives a product by setting its status to archived. This is a SAFE replacement for delete - preserves all data for audit trail and compliance. The product can be unarchived later if needed. IMPORTANT: DELETE operations are DANGEROUS and NOT ALLOWED. Always use archive instead of delete.',
  parameters: z.object({
    sku: z.string().describe('The SKU (Stock Keeping Unit) of any variant of the product to archive (e.g., HP-BLK-001)'),
  }),
  execute: archiveProduct,
});

/**
 * Tool to unarchive a product.
 * Used by agents to restore archived products back to active or draft status.
 */
export const unarchiveProductTool = new FunctionTool({
  name: 'unarchive_product',
  description: 'Unarchives a product by restoring it from archived status to active or draft. Use this to recover products that were previously archived.',
  parameters: z.object({
    sku: z.string().describe('The SKU (Stock Keeping Unit) of any variant of the product to unarchive (e.g., HP-BLK-001)'),
    targetStatus: z.enum(['active', 'draft']).optional().describe('The status to restore the product to (default: active)'),
  }),
  execute: unarchiveProduct,
});
