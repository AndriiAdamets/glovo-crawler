import { ElementHandle as PlaywriteElementHandle } from 'playwright';

export interface Product {
  name: string;
  description?: string;
  price: number;
  child_modifiers?: {
    name: string;
    description?: string;
    min_selection: number;
    max_selection: number;
    child_items?: Product[];
  }[];
}

export interface Category {
  name: string;
  description?: string;
  items: Product[];
}

export enum PageSelectors {
  CATEGORY_CONTAINER = 'store-content',
  CATEGORY_NAME = 'list-title',
  CATEGORY_DESCRIPTION = 'list-description',
  PRODUCT_CONTAINER = 'product-row-content',
  PRODUCT_NAME = 'product-row-name__highlighter',
  PRODUCT_DESCRIPTION = 'product-row-description__highlighter',
  PRODUCT_PRICE = 'product-price-effective',
  MODAL_WINDOW = 'modal-window',
  MODAL_OVERLAY = 'modal-overlay',
  ADDRESS_MODAL_FORM = 'address-input-modal-container',
  MODIFIERS_LIST = 'custom-product-form',
}

export type ElementHandle = PlaywriteElementHandle<HTMLElement>;
