interface BaseDescription {
  name: string;
  description?: string;
}
export interface ModifierItem extends BaseDescription {
  price: number;
}

export interface Modifier extends BaseDescription {
  min_selection: number;
  max_selection: number;
  child_items: ModifierItem[];
}

export interface Product extends BaseDescription {
  price: number;
  child_modifiers?: Modifier[];
}

export interface Category extends BaseDescription {
  items: Product[];
}

export interface NuxtStateModifierItem extends BaseDescription {
  priceImpact: number;
}

export interface NuxtStateModifier {
  name: string;
  min: number;
  max: number;
  attributes: NuxtStateModifierItem[];
}

export interface NuxtStateProduct {
  data: {
    name: string;
    description?: string;
    price: number;
    attributeGroups: NuxtStateModifier[];
  };
}

export interface NuxtStateCategory {
  data: {
    title: string;
    slug: string;
    elements: NuxtStateProduct[];
  }
}