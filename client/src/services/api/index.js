/**
 * ============================================================================
 * FILE: index.js
 * PURPOSE: The Master API Exporter.
 * DESCRIPTION: Combines all modularized API domains (finance, orders, clients) 
 * into a single `api` object. Allows React components to import 
 * everything cleanly from '../services/api' without needing to 
 * know how the files are split under the hood.
 * ============================================================================
 */

// client/src/services/api/index.js
import { clientApi } from './clientApi';
import { orderApi } from './orderApi';
import { productApi } from './productApi';
import { financeApi } from './financeApi';
import { billingApi } from './billingApi';


export const api = {
  ...clientApi,
  ...orderApi,
  ...productApi,
  ...financeApi,
  ...billingApi,

};


