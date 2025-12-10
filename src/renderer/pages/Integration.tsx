import { useEffect, useState } from 'react';
import { useToast } from '../hooks/useToast';

interface BackupSettings {
  backupPath: string | null;
  autoBackupEnabled: boolean;
  lastBackupDate: string | null;
  backupFormat: 'csv' | 'json';
}

const Integration = () => {
  const { showToast, ToastContainer } = useToast();
  const [settings, setSettings] = useState<BackupSettings>({
    backupPath: null,
    autoBackupEnabled: false,
    lastBackupDate: null,
    backupFormat: 'csv',
  });
  const [loading, setLoading] = useState(false);
  const [backupStatus, setBackupStatus] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [showDateRange, setShowDateRange] = useState(false);

  useEffect(() => {
    loadSettings();
    checkBackupStatus();
  }, []);

  const loadSettings = async () => {
    try {
      if (!window.electronAPI?.backup) {
        console.error('Backup API not available. Please restart the application.');
        setBackupStatus('Backup API not available. Please restart the application.');
        return;
      }
      const data = await window.electronAPI.backup.getSettings();
      setSettings(data);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const checkBackupStatus = async () => {
    try {
      const status = await window.electronAPI.backup.getStatus();
      setBackupStatus(status);
    } catch (error) {
      console.error('Error checking backup status:', error);
    }
  };

  const handleSelectFolder = async () => {
    try {
      if (!window.electronAPI?.backup?.selectFolder) {
        showToast('Backup API not available. Please restart the application.', 'error');
        return;
      }
      const path = await window.electronAPI.backup.selectFolder();
      if (path) {
        await window.electronAPI.backup.updateSettings({
          ...settings,
          backupPath: path,
        });
        setSettings((prev) => ({ ...prev, backupPath: path }));
        showToast('Backup folder selected successfully', 'success');
      }
    } catch (error: any) {
      console.error('Error selecting folder:', error);
      showToast(error.message || 'Failed to select folder', 'error');
    }
  };

  const handleToggleAutoBackup = async () => {
    try {
      const newSettings = {
        ...settings,
        autoBackupEnabled: !settings.autoBackupEnabled,
      };
      await window.electronAPI.backup.updateSettings(newSettings);
      setSettings(newSettings);
      
      if (newSettings.autoBackupEnabled) {
        showToast('Automatic daily backups enabled', 'success');
      } else {
        showToast('Automatic daily backups disabled', 'info');
      }
    } catch (error: any) {
      console.error('Error updating settings:', error);
      showToast(error.message || 'Failed to update settings', 'error');
    }
  };

  const handleBackupFormatChange = async (format: 'csv' | 'json') => {
    try {
      const newSettings = { ...settings, backupFormat: format };
      await window.electronAPI.backup.updateSettings(newSettings);
      setSettings(newSettings);
      showToast(`Backup format changed to ${format.toUpperCase()}`, 'success');
    } catch (error: any) {
      console.error('Error updating format:', error);
      showToast(error.message || 'Failed to update format', 'error');
    }
  };

  const handleManualBackup = async () => {
    if (!settings.backupPath) {
      showToast('Please select a backup folder first', 'error');
      return;
    }

    // Validate date range if provided
    if (showDateRange && startDate && endDate) {
      if (new Date(startDate) > new Date(endDate)) {
        showToast('Start date must be before end date', 'error');
        return;
      }
    }

    setLoading(true);
    try {
      const dateRange = showDateRange && startDate && endDate 
        ? { startDate, endDate } 
        : undefined;
      const result = await window.electronAPI.backup.createBackup(dateRange);
      await loadSettings();
      await checkBackupStatus();
      const dateInfo = dateRange 
        ? ` (${startDate} to ${endDate})` 
        : ' (all invoices)';
      showToast(`Backup created successfully: ${result.filename}${dateInfo}`, 'success');
      // Reset date range after successful backup
      setStartDate('');
      setEndDate('');
      setShowDateRange(false);
    } catch (error: any) {
      console.error('Error creating backup:', error);
      showToast(error.message || 'Failed to create backup', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      {/* Compact Header Section */}
      <div className="bg-gradient-to-r from-blue-500 via-blue-600 to-green-500 rounded-lg shadow-lg p-4 text-white">
        <div className="flex items-center space-x-4">
          <div className="bg-white rounded-lg p-2 shadow-md">
            <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7.71 3.5L1.15 15l3.42 5.9h12.86l6.56-11.4L16.29 3.5H7.71z" fill="#4285F4"/>
              <path d="M16.29 3.5L7.71 3.5 1.15 15l6.56 5.9 9.58-11.4z" fill="#34A853"/>
              <path d="M16.29 3.5l6.56 11.4-3.42 5.9H7.71l-3.42-5.9L10.87 3.5z" fill="#EA4335"/>
              <path d="M7.71 3.5L1.15 15h12.86l6.56-11.5z" fill="#FBBC04"/>
            </svg>
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-1">Backup & Integration</h2>
            <p className="text-blue-100 text-sm">Automatic Google Drive cloud backups</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-100 p-5">
        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Left Column - Settings */}
          <div className="space-y-4">

            {/* Backup Folder Selection */}
            <div className="p-4 bg-gradient-to-br from-blue-50 to-white rounded-lg border border-blue-200">
              <div className="flex items-center space-x-2 mb-3">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <label className="block text-sm font-bold text-gray-900">
                  Backup Folder
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={settings.backupPath || 'No folder selected'}
                  readOnly
                  className="flex-1 px-3 py-2 text-xs border border-gray-300 rounded-lg bg-white text-gray-700"
                />
                <button
                  onClick={handleSelectFolder}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Browse
                </button>
              </div>
              {settings.backupPath && (
                <div className="mt-2 flex items-center space-x-2 text-xs text-green-700 bg-green-50 p-2 rounded border border-green-200">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="truncate">{settings.backupPath}</span>
                </div>
              )}
            </div>

            {/* Backup Format */}
            <div className="p-4 bg-gradient-to-br from-purple-50 to-white rounded-lg border border-purple-200">
              <div className="flex items-center space-x-2 mb-3">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <label className="block text-sm font-bold text-gray-900">
                  Backup Format
                </label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label className={`relative flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                  settings.backupFormat === 'csv' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}>
                  <input
                    type="radio"
                    name="backupFormat"
                    value="csv"
                    checked={settings.backupFormat === 'csv'}
                    onChange={() => handleBackupFormatChange('csv')}
                    className="sr-only"
                  />
                  <div className="flex items-center space-x-2 w-full">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div className="flex-1">
                      <div className="font-semibold text-xs text-gray-900">CSV</div>
                      <div className="text-xs text-gray-600">Excel</div>
                    </div>
                    {settings.backupFormat === 'csv' && (
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </label>
                <label className={`relative flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                  settings.backupFormat === 'json' 
                    ? 'border-purple-500 bg-purple-50' 
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}>
                  <input
                    type="radio"
                    name="backupFormat"
                    value="json"
                    checked={settings.backupFormat === 'json'}
                    onChange={() => handleBackupFormatChange('json')}
                    className="sr-only"
                  />
                  <div className="flex items-center space-x-2 w-full">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                    <div className="flex-1">
                      <div className="font-semibold text-xs text-gray-900">JSON</div>
                      <div className="text-xs text-gray-600">Full data</div>
                    </div>
                    {settings.backupFormat === 'json' && (
                      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </label>
              </div>
            </div>

            {/* Auto Backup Toggle */}
            <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-sm">Auto Backup</h3>
                    <p className="text-xs text-gray-600">Daily at midnight</p>
                    {!settings.backupPath && (
                      <p className="text-xs text-red-600 mt-1">Select folder first</p>
                    )}
                  </div>
                </div>
                <label className={`relative inline-flex items-center cursor-pointer ${!settings.backupPath ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <input
                    type="checkbox"
                    checked={settings.autoBackupEnabled}
                    onChange={handleToggleAutoBackup}
                    disabled={!settings.backupPath}
                    className="sr-only peer"
                  />
                  <div className="w-12 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                </label>
              </div>
            </div>

            {/* Date Range Selection */}
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <label className="text-sm font-semibold text-gray-900">Date Range (Optional)</label>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showDateRange}
                    onChange={(e) => setShowDateRange(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              {showDateRange && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      max={endDate || new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate || undefined}
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              )}
              {showDateRange && !startDate && !endDate && (
                <p className="text-xs text-gray-500 mt-2">Leave empty to backup all invoices</p>
              )}
            </div>

            {/* Manual Backup Button */}
            <button
              onClick={handleManualBackup}
              disabled={!settings.backupPath || loading}
              className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all font-semibold shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>Backup Now</span>
                </>
              )}
            </button>
          </div>

          {/* Right Column - Status & Info */}
          <div className="space-y-4">
            {/* Backup Status */}
            <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-2 mb-3">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="font-bold text-gray-900 text-sm">Status</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-gray-600 mb-1">Last Backup</div>
                  <div className="font-semibold text-gray-900 text-sm">
                    {settings.lastBackupDate 
                      ? new Date(settings.lastBackupDate).toLocaleDateString()
                      : 'Never'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-600 mb-1">Auto Backup</div>
                  <div className={`font-semibold text-sm flex items-center space-x-2 ${
                    settings.autoBackupEnabled ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${
                      settings.autoBackupEnabled ? 'bg-green-500' : 'bg-gray-400'
                    }`}></div>
                    <span>{settings.autoBackupEnabled ? 'Active' : 'Inactive'}</span>
                  </div>
                </div>
                {backupStatus && (
                  <div className="p-2 bg-blue-100 rounded text-xs text-blue-800 border border-blue-200">
                    {backupStatus}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Guide */}
            <div className="p-4 bg-gradient-to-br from-blue-50 to-green-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-2 mb-3">
                <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7.71 3.5L1.15 15l3.42 5.9h12.86l6.56-11.4L16.29 3.5H7.71z" fill="#4285F4"/>
                  <path d="M16.29 3.5L7.71 3.5 1.15 15l6.56 5.9 9.58-11.4z" fill="#34A853"/>
                  <path d="M16.29 3.5l6.56 11.4-3.42 5.9H7.71l-3.42-5.9L10.87 3.5z" fill="#EA4335"/>
                  <path d="M7.71 3.5L1.15 15h12.86l6.56-11.5z" fill="#FBBC04"/>
                </svg>
                <h3 className="font-bold text-gray-900 text-sm">Quick Guide</h3>
              </div>
              <div className="space-y-2 text-xs text-gray-700">
                <div className="flex items-start space-x-2">
                  <span className="font-bold text-blue-600">1.</span>
                  <span>Install Google Drive Desktop</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="font-bold text-green-600">2.</span>
                  <span>Select Google Drive folder</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="font-bold text-purple-600">3.</span>
                  <span>Enable auto-backup</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
      <ToastContainer />
    </div>
  );
};

export default Integration;

