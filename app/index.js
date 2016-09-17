const path = require('path');

const electron = require('electron');

const {BrowserWindow, ipcMain, Menu} = electron;
const menubar = require('menubar')({
  index: `file://${__dirname}/dist/index.html`,
  icon: path.join(__dirname, 'static', 'iconTemplate.png'),
  width: 250,
  height: 500,
  preloadWindow: true,
  transparent: true,
  resizable: false
});
const opn = require('opn');

let mainWindow;

if (process.env.DEBUG_FOCUS) {
  const electronExecutable = `${__dirname}/../node_modules/electron/dist/Electron.app/Contents/MacOS/Electron`;
  require('electron-reload')(`${__dirname}/dist`, {electron: electronExecutable}); // eslint-disable-line import/newline-after-import
  menubar.setOption('alwaysOnTop', true);
}

ipcMain.on('set-window-size', (event, args) => {
  if (args.width && args.height && mainWindow) {
    mainWindow.setSize(args.width, args.height, true); // true == animate
  }
});

const optionsMenu = Menu.buildFromTemplate([
  {
    label: 'About',
    click: () => opn('http://wulka.no', {wait: false})
  },
  {
    type: 'separator'
  },
  {
    label: 'Quit',
    accelerator: 'Cmd+Q', // TODO change this when support for win/linux is added
    click: () => menubar.app.quit()
  }
]);

ipcMain.on('show-options-menu', (event, coordinates) => {
  if (coordinates && coordinates.x && coordinates.y) {
    coordinates.x = parseInt(coordinates.x.toFixed(), 10);
    coordinates.y = parseInt(coordinates.y.toFixed(), 10);

    optionsMenu.popup(coordinates.x + 4, coordinates.y); // 4 is the magic number ✨
  }
});

let cropperWindow;

function setCropperWindowOnBlur() {
  cropperWindow.on('blur', () => {
    if (!mainWindow.isFocused() &&
        !cropperWindow.webContents.isDevToolsFocused() &&
        !mainWindow.webContents.isDevToolsFocused()) {
      cropperWindow.close();
    }
  });
}

ipcMain.on('open-cropper-window', () => {
  mainWindow.setAlwaysOnTop(true); // TODO send a PR to `menubar`
  menubar.setOption('alwaysOnTop', true);
  if (cropperWindow) {
    cropperWindow.focus();
  } else {
    const {workAreaSize} = electron.screen.getPrimaryDisplay();
    cropperWindow = new BrowserWindow({
      width: 500,
      height: 500,
      frame: false,
      transparent: true,
      resizable: true
    });
    cropperWindow.loadURL(`file://${__dirname}/dist/cropper.html`);
    cropperWindow.setIgnoreMouseEvents(false); // TODO this should be false by default

    if (process.env.DEBUG_FOCUS) {
      cropperWindow.openDevTools({mode: 'detach'});
      cropperWindow.webContents.on('devtools-opened', () => {
        setCropperWindowOnBlur();
      });
    } else {
      setCropperWindowOnBlur();
    }

    cropperWindow.on('closed', () => {
      cropperWindow = undefined;
    });
  }
});

ipcMain.on('close-cropper-window', () => {
  if (cropperWindow) {
    mainWindow.setAlwaysOnTop(false); // TODO send a PR to `menubar`
    menubar.setOption('alwaysOnTop', false);
    cropperWindow.close(); // TODO: cropperWindow.hide()
  }
});

menubar.on('after-create-window', () => {
  mainWindow = menubar.window;
  if (process.env.DEBUG_FOCUS) {
    mainWindow.openDevTools({mode: 'detach'});
  }

  mainWindow.on('blur', () => {
    if (cropperWindow && !cropperWindow.isFocused()) {
      // close the cropper window if the main window loses focus and the cropper window
      // is not focused
      cropperWindow.close();
    }
  });

  ipcMain.on('get-cropper-bounds', event => {
    if (cropperWindow) {
      console.log('event', cropperWindow.getContentBounds());
      event.returnValue = cropperWindow.getContentBounds();
    }
  });
});
