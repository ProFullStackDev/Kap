'use strict';

const {Tray} = require('electron');
const path = require('path');

const {openCropperWindow} = require('./cropper');
const {openEditorWindow} = require('./editor');
const {cogMenu} = require('./menus');
const {track} = require('./common/analytics');

let tray = null;
const EXTENSIONS = ['.mp4', '.mov', '.m4v'];

const initializeTray = () => {
  tray = new Tray(path.join(__dirname, '..', 'static', 'menubarDefaultTemplate.png'));
  tray.on('click', openCropperWindow);
  tray.on('right-click', () => {
    tray.popUpContextMenu(cogMenu);
  });
  tray.on('drop-files', (event, files) => {
    for (const file of files) {
      const extension = path.extname(file).toLowerCase();
      if (EXTENSIONS.includes(extension)) {
        track('editor/opened/tray');
        openEditorWindow(file);
      }
    }
  });

  return tray;
};

const disableTray = () => {
  tray.removeListener('click', openCropperWindow);
};

const setRecordingTray = async stopRecording => {
  animateIcon();

  tray.once('click', () => {
    stopRecording();
    tray.setImage(path.join(__dirname, '..', 'static', 'menubarDefaultTemplate.png'));
    tray.on('click', openCropperWindow);
  });
};

const animateIcon = () => new Promise(resolve => {
  const interval = 20;
  let i = 0;

  const next = () => {
    setTimeout(() => {
      const number = String(i++).padStart(5, '0');
      const filename = `loading_${number}Template.png`;

      try {
        tray.setImage(path.join(__dirname, '..', 'static', 'menubar-loading', filename));
        next();
      } catch (_) {
        resolve();
      }
    }, interval);
  };

  next();
});

module.exports = {
  initializeTray,
  disableTray,
  setRecordingTray
};
