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
    deleteAll: () => ipcRenderer.invoke('products:deleteAll'),
    deleteByName: (name: string) => ipcRenderer.invoke('products:deleteByName', name),
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
    dateRangeSales: (startDate: string, endDate: string) => ipcRenderer.invoke('reports:dateRangeSales', startDate, endDate),
    productPerformance: () => ipcRenderer.invoke('reports:productPerformance'),
    customerReport: () => ipcRenderer.invoke('reports:customerReport'),
  },

  // Backup APIs
      backup: {
        getSettings: () => ipcRenderer.invoke('backup:getSettings'),
        updateSettings: (settings: any) => ipcRenderer.invoke('backup:updateSettings', settings),
        selectFolder: () => ipcRenderer.invoke('backup:selectFolder'),
        createBackup: (dateRange?: { startDate: string; endDate: string }) => ipcRenderer.invoke('backup:createBackup', dateRange),
        getStatus: () => ipcRenderer.invoke('backup:getStatus'),
      },

  // Auth APIs
  auth: {
    checkSetup: () => ipcRenderer.invoke('auth:checkSetup'),
    setup: (username: string, password: string) => ipcRenderer.invoke('auth:setup', username, password),
    login: (username: string, password: string) => ipcRenderer.invoke('auth:login', username, password),
    logout: () => ipcRenderer.invoke('auth:logout'),
    getCurrentUser: () => ipcRenderer.invoke('auth:getCurrentUser'),
    changePassword: (currentPassword: string, newPassword: string) => ipcRenderer.invoke('auth:changePassword', currentPassword, newPassword),
    resetPassword: (masterKey: string, newPassword: string) => ipcRenderer.invoke('auth:resetPassword', masterKey, newPassword),
    deleteAdmin: () => ipcRenderer.invoke('auth:deleteAdmin'),
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
        dateRangeSales: (startDate: string, endDate: string) => Promise<any>;
        productPerformance: () => Promise<any>;
        customerReport: () => Promise<any>;
      };
      backup: {
        getSettings: () => Promise<any>;
        updateSettings: (settings: any) => Promise<any>;
        selectFolder: () => Promise<string | null>;
        createBackup: (dateRange?: { startDate: string; endDate: string }) => Promise<{ filename: string; path: string }>;
        getStatus: () => Promise<string>;
      };
      auth: {
        checkSetup: () => Promise<boolean>;
        setup: (username: string, password: string) => Promise<{ masterKey: string }>;
        login: (username: string, password: string) => Promise<{ username: string; last_login: string | null } | null>;
        logout: () => Promise<{ success: boolean }>;
        getCurrentUser: () => Promise<{ username: string; last_login: string | null } | null>;
        changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean }>;
        resetPassword: (masterKey: string, newPassword: string) => Promise<{ success: boolean }>;
        deleteAdmin: () => Promise<{ deleted: number }>;
      };
      app: {
        getVersion: () => Promise<string>;
        getDbPath: () => Promise<string>;
      };
    };
  }
}

