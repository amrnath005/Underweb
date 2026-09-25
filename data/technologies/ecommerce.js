// data/technologies/ecommerce.js
// Signatures for e-commerce platforms and storefront systems.

export const ECOMMERCE_TECHNOLOGIES = [
  {
    id: 'shopify',
    name: 'Shopify',
    category: 'E-Commerce',
    website: 'https://www.shopify.com',
    description: 'Leading global commerce company providing infrastructure for commerce.',
    signatures: {
      globals: ['Shopify', 'ShopifyAnalytics', 'BOOMR'],
      dom: ['link[href*="cdn.shopify.com"]', 'input[name="checkout"]'],
      scripts: [/cdn\.shopify\.com/i, /shopify-perf/i],
      headers: {
        'x-shopify-stage': /.+/i,
        'x-shopid': /.+/i,
        'server': /cloudflare-shopify/i
      }
    }
  },
  {
    id: 'woocommerce',
    name: 'WooCommerce',
    category: 'E-Commerce',
    website: 'https://woocommerce.com',
    description: 'Customizable, open-source ecommerce platform built on WordPress.',
    signatures: {
      globals: ['woocommerce_params', 'wc_add_to_cart_params'],
      dom: ['body[class*="woocommerce"]', '.woocommerce-Price-amount'],
      scripts: [/woocommerce(?:\.min)?\.js/i],
      meta: [{ name: 'generator', content: /WooCommerce/i }]
    }
  },
  {
    id: 'magento',
    name: 'Magento (Adobe Commerce)',
    category: 'E-Commerce',
    website: 'https://business.adobe.com/products/magento/magento-commerce.html',
    description: 'Flexible digital commerce platform for B2B and B2C experiences.',
    signatures: {
      globals: ['Mage', 'magento'],
      dom: ['script[type="text/x-magento-init"]', 'body[class*="page-products"]'],
      cookies: [/frontend/i, /mage-messages/i]
    }
  },
  {
    id: 'bigcommerce',
    name: 'BigCommerce',
    category: 'E-Commerce',
    website: 'https://www.bigcommerce.com',
    description: 'Open SaaS ecommerce platform for growing and established brands.',
    signatures: {
      globals: ['BCData', 'BigCommerce'],
      scripts: [/cdn\.bigcommerce\.com/i],
      headers: {
        'x-bc-store-id': /.+/i
      }
    }
  },
  {
    id: 'prestashop',
    name: 'PrestaShop',
    category: 'E-Commerce',
    website: 'https://prestashop.com',
    description: 'Open source e-commerce solution powering stores worldwide.',
    signatures: {
      globals: ['prestashop'],
      meta: [{ name: 'generator', content: /PrestaShop/i }]
    }
  },
  {
    id: 'salesforce-commerce',
    name: 'Salesforce Commerce Cloud',
    category: 'E-Commerce',
    website: 'https://www.salesforce.com/products/commerce-cloud/overview/',
    description: 'Highly scalable, cloud-based B2C and B2B commerce platform.',
    signatures: {
      globals: ['dw'],
      scripts: [/demandware\.static/i]
    }
  }
];
