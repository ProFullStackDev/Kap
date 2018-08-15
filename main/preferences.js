'use strict';

const {BrowserWindow, ipcMain} = require('electron');
const {closeAllCroppers} = require('./cropper');
const loadRoute = require('./utils/routes');
const {track} = require('./common/analytics');

let prefsWindow = null;

const openPrefsWindow = () => {
  track('preferences/opened');
  closeAllCroppers();

  if (prefsWindow) {
    return prefsWindow.show();
  }

  prefsWindow = new BrowserWindow({
    width: 480,
    height: 480,
    resizable: false,
    minimizable: false,
    maximizable: false,
    titleBarStyle: 'hiddenInset',
    show: false
  });

  prefsWindow.on('close', () => {
    prefsWindow = null;
  });

  loadRoute(prefsWindow, 'preferences');

  ipcMain.once('preferences-ready', () => {
    prefsWindow.show();
  });
};

module.exports = {
  openPrefsWindow
};
