import { contextBridge, ipcRenderer } from 'electron';

/**
 * Expose protected methods that allow the renderer process to use
 * the ipcRenderer without exposing the entire object
 */
contextBridge.exposeInMainWorld('electronAPI', {
  // Product APIs
  products: {
    getAll: () => ipcRenderer.invoke('products:getAll'),
    getById: (id: number) => ipcRenderer.invoke('products:getById', id),
    create: (product: any) => ipcRenderer.invoke('products:create', product),
    update: (id: number, product: any) => ipcRenderer.invoke('products:update', id, product),
    delete: (id: number) => ipcRenderer.invoke('products:delete', id),
    getLowStock: () => ipcRenderer.invoke('products:getLowStock'),
    getByType: (type: string) => ipcRenderer.invoke('products:getByType', type),
    getBySize: (size: string) => ipcRenderer.invoke('products:getBySize', size),
  },

  // Brands APIs
  brands: {
    getAll: () => ipcRenderer.invoke('brands:getAll'),
    create: (name: string) => ipcRenderer.invoke('brands:create', name),
    delete: (id: number) => ipcRenderer.invoke('brands:delete', id),
  },

  // Tire Sizes APIs
  tireSizes: {
    getAll: () => ipcRenderer.invoke('tireSizes:getAll'),
    create: (sizeData: any) => ipcRenderer.invoke('tireSizes:create', sizeData),
    delete: (id: number) => ipcRenderer.invoke('tireSizes:delete', id),
  },

  // Wheel Sizes APIs
  wheelSizes: {
    getAll: () => ipcRenderer.invoke('wheelSizes:getAll'),
    create: (sizeData: any) => ipcRenderer.invoke('wheelSizes:create', sizeData),
    delete: (id: number) => ipcRenderer.invoke('wheelSizes:delete', id),
  },

  // Invoice APIs
  invoices: {
    create: (invoiceData: any) => ipcRenderer.invoke('invoices:create', invoiceData),
    getAll: () => ipcRenderer.invoke('invoices:getAll'),
    getById: (id: number) => ipcRenderer.invoke('invoices:getById', id),
    getByDateRange: (startDate: string, endDate: string) =>
      ipcRenderer.invoke('invoices:getByDateRange', startDate, endDate),
  },

  // Reports APIs
  reports: {
    dailySales: (date: string) => ipcRenderer.invoke('reports:dailySales', date),
  },

  // App utilities
  app: {
    getVersion: () => ipcRenderer.invoke('app:getVersion'),
    getDbPath: () => ipcRenderer.invoke('app:getDbPath'),
  },
});

// Type definitions for TypeScript
declare global {
  interface Window {
    electronAPI: {
      products: {
        getAll: () => Promise<any[]>;
        getById: (id: number) => Promise<any>;
        create: (product: any) => Promise<any>;
        update: (id: number, product: any) => Promise<any>;
        delete: (id: number) => Promise<any>;
        getLowStock: () => Promise<any[]>;
      };
      invoices: {
        create: (invoiceData: any) => Promise<any>;
        getAll: () => Promise<any[]>;
        getById: (id: number) => Promise<any>;
        getByDateRange: (startDate: string, endDate: string) => Promise<any[]>;
      };
      reports: {
        dailySales: (date: string) => Promise<any>;
      };
      app: {
        getVersion: () => Promise<string>;
        getDbPath: () => Promise<string>;
      };
    };
  }
}

