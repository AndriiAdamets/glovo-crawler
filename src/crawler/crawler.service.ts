import { Injectable } from '@nestjs/common';
import { chromium, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import {
  Category,
  Modifier,
  ModifierItem,
  NuxtStateCategory,
  NuxtStateModifier,
  NuxtStateModifierItem,
  NuxtStateProduct,
  Product,
} from './crawler.types';

@Injectable()
export class CrawlerService {
  async crawl(url: string): Promise<void> {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    console.log(`Navigating to ${url}`);
    await page.goto(url, { waitUntil: 'networkidle' });
    const state = await this.extractNuxtState(page);

    const categories = this.parseCategories(state);

    await browser.close();

    this.writeCategoriesToFile(categories);
  }

  parseCategories(state: NuxtStateCategory[]): Category[] {
    return state.map(({ data }) => ({
      name: data.title,
      description: data.slug,
      items: this.parseProducts(data.elements),
    }))
  }

  parseProducts(productsList: NuxtStateProduct[]): Product[] {
    return productsList.map(({data}) => {
      const { name, description, price, attributeGroups } = data;

      return { name,
        description,
        price,
        child_modifiers: this.parseModifiers(attributeGroups),
      };
    })
  }

  parseModifiers(modifiersList: NuxtStateModifier[]): Modifier[] {
    return modifiersList.map(({
      name,
      min: min_selection,
      max: max_selection,
      attributes
    }) => ({
      name,
      min_selection,
      max_selection,
      child_items: this.parseModifierItems(attributes),
    }))
  }

  parseModifierItems(modifierItemsList: NuxtStateModifierItem[]): ModifierItem[] {
    return modifierItemsList.map(({name, description, priceImpact}) => ({
      name,
       description,
       price: priceImpact || 0,
    }))
  }

  extractNuxtState(page: Page): Promise<NuxtStateCategory[]> {
    return page.evaluate(() => {
      return (window as any).__NUXT__.data[1].initialData.body;
    });
  }

  private writeCategoriesToFile(categories: Category[]): void {
    const outputPath = path.join(__dirname, '..', '..', 'data', 'output.json');
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify({ categories }, null, 2));
    console.log(`✅ Menu data saved to ${outputPath}`);
  }
}
