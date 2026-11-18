const path = require('path');
const { defineConfig } = require("cypress");

require('dotenv').config({ path: path.resolve(__dirname, 'cypress/.env') }); //foi preciso add pq não estava enxergando meu .env
require('dotenv').config();

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      config.env = process.env;
      return config;
    },
    baseUrl: process.env.CYPRESS_BASE_URL || 'http://127.0.0.1:3000',
    
  },
});
