'use strict';

const path = require('path');
const fs = require('fs');
const electron = require('electron');
const {BrowserWindow, app} = require('electron');
const ipc = require('electron-better-ipc');
const {is} = require('electron-util');

const {converters} = require('./convert');
const getFps = require('./utils/fps');
const loadRoute = require('./utils/routes');

let editors = 0;

const OPTIONS_BAR_HEIGHT = 48;
const VIDEO_ASPECT = 9 / 16;
const MIN_VIDEO_WIDTH = 768;
const MIN_VIDEO_HEIGHT = MIN_VIDEO_WIDTH * VIDEO_ASPECT;
const MIN_WINDOW_HEIGHT = MIN_VIDEO_HEIGHT + OPTIONS_BAR_HEIGHT;

const openEditorWindow = async (filePath, recordFps) => {
  const fps = recordFps || await getFps(filePath);

  const editorWindow = new BrowserWindow({
    minWidth: MIN_VIDEO_WIDTH,
    minHeight: MIN_WINDOW_HEIGHT,
    width: MIN_VIDEO_WIDTH,
    height: MIN_WINDOW_HEIGHT,
    frame: false,
    webPreferences: {
      webSecurity: !is.development // Disable webSecurity in dev to load video over file:// protocol while serving over insecure http, this is not needed in production where we use file:// protocol for html serving.
    },
    transparent: true,
    show: false
  });

  editors++;
  app.dock.show();

  loadRoute(editorWindow, 'editor');

  editorWindow.on('closed', () => {
    editors--;
    if (!editors) {
      app.dock.hide();
    }
  });

  editorWindow.webContents.on('did-finish-load', async () => {
    await ipc.callRenderer(editorWindow, 'file', {filePath, fps});
    editorWindow.show();
  });
};

const prettifyFormat = format => {
  const formats = new Map([
    ['apng', 'APNG'],
    ['gif', 'GIF'],
    ['mp4', 'MP4'],
    ['webm', 'WebM']
  ]);

  return formats.get(format);
};

ipc.answerRenderer('export-options', () => {
  const cwd = path.join(electron.app.getPath('userData'), 'plugins');
  const pkg = fs.readFileSync(path.join(cwd, 'package.json'), 'utf8');
  const pluginNames = Object.keys(JSON.parse(pkg).dependencies);

  const options = {};
  for (const format of converters.keys()) {
    options[format] = {
      format,
      prettyFormat: prettifyFormat(format),
      plugins: [{
        title: 'Save to Disk',
        pluginName: 'default',
        isDefault: true
      }]
    };
  }

  for (const pluginName of pluginNames) {
    const plugin = require(path.join(cwd, 'node_modules', pluginName));
    for (const service of plugin.shareServices) {
      for (const format of service.formats) {
        options[format].plugins.push({title: service.title, pluginName});
      }
    }
  }

  return options;
});

module.exports = {
  openEditorWindow
};
