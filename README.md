# Glovo Crawler

This project is a scalable web crawler built with **NestJS**, **TypeScript**, and **Playwright**.  
It scrapes restaurant menu data from [Glovo](https://glovoapp.com) including product details and their modifiers (customizations).  

The final output is saved as a structured JSON file.

## Installation

```bash
git clone https://github.com/yourusername/glovo-crawler.git
cd glovo-crawler
npm install
```

## Usage

```bash
npm run crawl -- <YOUR_URL>
```

You can get results in `data/output.json`