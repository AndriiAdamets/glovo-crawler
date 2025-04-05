import { Injectable } from '@nestjs/common';
import { chromium, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import {
  Category,
  Product,
  PageSelectors,
  ElementHandle,
} from './crawler.types';

@Injectable()
export class CrawlerService {
  async crawl(url: string): Promise<void> {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    console.log(`Navigating to ${url}`);
    await page.goto(url, { waitUntil: 'load' });

    await this.autoScroll(page);

    const categories = await this.parseCategories(page);

    await browser.close();

    this.writeCategoriesToFile(categories);
  }

  private async parseCategories(page: Page): Promise<Category[]> {
    const categoriesHandles = await this.getElementChildren(
      page,
      PageSelectors.CATEGORY_CONTAINER,
    );
    const categories: Category[] = [];

    for (const sectionHandle of categoriesHandles) {
      const categoryName = await this.getElementText(
        sectionHandle,
        PageSelectors.CATEGORY_NAME,
        'Untitled category',
      );

      const productContainers = await this.getElementChildren(
        sectionHandle,
        PageSelectors.PRODUCT_CONTAINER,
      );
      const items: Product[] = [];

      for (const container of productContainers) {
        const product = await this.getProductInfo(container, page);
        items.push(product);
      }

      categories.push({
        name: categoryName,
        items,
      });
    }

    return categories;
  }

  private async getProductInfo(
    productContainer: ElementHandle,
    page: Page,
  ): Promise<Product> {
    const [name, description, priceStr] = await Promise.all([
      this.getElementText(productContainer, PageSelectors.PRODUCT_NAME),
      this.getElementText(productContainer, PageSelectors.PRODUCT_DESCRIPTION),
      this.getElementText(productContainer, PageSelectors.PRODUCT_PRICE),
    ]);

    await productContainer.click();

    await page.waitForSelector(
      this.getElementSelectorAttribute(PageSelectors.MODAL_WINDOW),
      { timeout: 5000 },
    );

    const addressModal = await page.$(
      this.getElementSelectorAttribute(PageSelectors.ADDRESS_MODAL_FORM),
    );
    if (addressModal) {
      await this.closeModal(page, PageSelectors.ADDRESS_MODAL_FORM);
    }

    await page.waitForSelector(
      this.getElementSelectorAttribute(PageSelectors.MODIFIERS_LIST),
      { timeout: 5000 },
    );

    const modifiers = await this.extractModifiersFromModal(page);

    await this.closeModal(page);

    return {
      name,
      description,
      price: this.parsePrice(priceStr),
      child_modifiers: modifiers,
    };
  }

  private parsePrice(priceStr: string): number {
    const clean = priceStr.replace(/[^\d.,-]/g, '').replace(',', '.');
    return parseFloat(clean) || 0;
  }

  private async extractModifiersFromModal(
    page: Page,
  ): Promise<Product['child_modifiers']> {
    return await page.$$eval('.custom-body > *', (modifierGroups) => {
      return modifierGroups.map((groupEl) => {
        const name =
          groupEl.querySelector('h2.title')?.textContent?.trim() ||
          'Unnamed modifier';
        const description =
          groupEl.querySelector('.subtitle-content')?.textContent?.trim() || '';
        const hasBadge = groupEl.querySelector('.subtitle .badge') !== null;
        const min_selection = hasBadge ? 1 : 0;

        const optionElements = groupEl.querySelectorAll(
          '[class*="customization__content"] [data-test-id="container"]',
        );
        const isRadio = groupEl.querySelector('input[type="radio"]') !== null;
        const isCheckbox =
          groupEl.querySelector('input[type="checkbox"]') !== null;

        const child_items = Array.from(optionElements).map((optionEl) => {
          const nameLabel = optionEl.querySelector('[data-test-id="name"]');
          const name = nameLabel?.childNodes[0]?.textContent?.trim() || '';
          const priceLabel = nameLabel?.querySelector('[data-test-id="price"]');
          const priceText = priceLabel?.textContent?.trim() || '';
          const price = priceText
            ? parseFloat(
                priceText.replace(/[^\d.,-]/g, '').replace(',', '.'),
              ) || 0
            : 0;

          return { name, price };
        });

        const max_selection = isRadio ? 1 : isCheckbox ? child_items.length : 0;

        return {
          name,
          description,
          min_selection,
          max_selection,
          child_items,
        };
      });
    });
  }

  private async closeModal(
    page: Page,
    checkSelector?: PageSelectors,
  ): Promise<void> {
    const modalOverlaySelector = this.getElementSelectorAttribute(
      PageSelectors.MODAL_OVERLAY,
    );
    const modalOverlay = await page.$(modalOverlaySelector);

    if (!modalOverlay) {
      return;
    }

    await modalOverlay.click({ position: { x: 10, y: 10 } });
    const modalSelector = checkSelector
      ? this.getElementSelectorAttribute(checkSelector)
      : modalOverlaySelector;

    await page
      .waitForSelector(modalSelector, { state: 'hidden', timeout: 5000 })
      .catch(() => {
        console.warn(`⚠️ Modal did not hide in time: ${modalSelector}`);
      });
  }

  private async autoScroll(page: Page): Promise<void> {
    await page.evaluate(async () => {
      await new Promise<void>((resolve) => {
        let totalHeight = 0;
        const distance = 100;
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;

          if (totalHeight >= scrollHeight - window.innerHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 100);
      });
    });
  }

  private getElementText(
    container: ElementHandle,
    selector: PageSelectors,
    defaultText = '',
  ): Promise<string> {
    return container
      .$eval(
        this.getElementSelectorAttribute(selector),
        (el) => el.textContent?.trim() || '',
      )
      .catch(() => defaultText);
  }

  private getElementChildren(
    container: Page | ElementHandle,
    selector: PageSelectors,
  ): Promise<ElementHandle[]> {
    return container.$$(this.getElementSelectorAttribute(selector)) as Promise<
      ElementHandle[]
    >;
  }

  private getElementSelectorAttribute(selector: PageSelectors): string {
    return `[data-test-id="${selector}"]`;
  }

  private writeCategoriesToFile(categories: Category[]): void {
    const outputPath = path.join(__dirname, '..', '..', 'data', 'output.json');
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify({ categories }, null, 2));
    console.log(`✅ Menu data saved to ${outputPath}`);
  }
}
