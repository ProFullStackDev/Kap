'use strict';

const {dialog} = require('electron');
const desktopIcons = require('hide-desktop-icons');
const dnd = require('@sindresorhus/do-not-disturb');
const createAperture = require('aperture');

const {openEditorWindow} = require('../editor');
const {closePrefsWindow} = require('../preferences');
const {setRecordingTray, disableTray, resetTray} = require('../tray');
const {disableCroppers, setRecordingCroppers, closeAllCroppers} = require('../cropper');
const {setCropperShortcutAction} = require('../global-accelerators');
const {convertToH264} = require('../utils/encoding');
const settings = require('./settings');
const {track} = require('./analytics');

const aperture = createAperture();
const {audioDevices, videoCodecs} = createAperture;
const recordHevc = videoCodecs.has('hevc');

let wasDoNotDisturbAlreadyEnabled;
let lastUsedSettings;

let past;

const startRecording = async options => {
  closePrefsWindow();
  disableTray();
  disableCroppers();

  const {cropperBounds, screenBounds, displayId} = options;
  past = Date.now();

  cropperBounds.y = screenBounds.height - (cropperBounds.y + cropperBounds.height);

  const {
    record60fps,
    showCursor,
    highlightClicks,
    recordAudio,
    audioInputDeviceId,
    hideDesktopIcons,
    doNotDisturb
  } = settings.store;

  const apertureOpts = {
    fps: record60fps ? 60 : 30,
    cropArea: cropperBounds,
    showCursor,
    highlightClicks,
    screenId: displayId
  };

  lastUsedSettings = {
    recordedFps: apertureOpts.fps,
    hideDesktopIcons,
    doNotDisturb
  };

  if (recordAudio === true) {
    // In case for some reason the default audio device is not set
    // use the first available device for recording
    if (audioInputDeviceId) {
      apertureOpts.audioDeviceId = audioInputDeviceId;
    } else {
      const [defaultAudioDevice] = await audioDevices();
      apertureOpts.audioDeviceId = defaultAudioDevice && defaultAudioDevice.id;
    }
  }

  if (recordHevc) {
    apertureOpts.videoCodec = 'hevc';
  }

  console.log(`Collected settings after ${(Date.now() - past) / 1000}s`);

  if (hideDesktopIcons) {
    await desktopIcons.hide();
  }

  console.log(`Hide desktop icons after ${(Date.now() - past) / 1000}s`);

  if (doNotDisturb) {
    wasDoNotDisturbAlreadyEnabled = await dnd.isEnabled();

    if (!wasDoNotDisturbAlreadyEnabled) {
      dnd.enable();
    }
  }

  console.log(`Took care of DND after ${(Date.now() - past) / 1000}s`);

  try {
    await aperture.startRecording(apertureOpts);

    const startTime = (Date.now() - past) / 1000;
    if (startTime > 3) {
      track(`recording/started/${startTime}`);
    } else {
      track('recording/started');
    }

    console.log(`Started recording after ${startTime}s`);
    setRecordingCroppers();
    setRecordingTray(stopRecording);
    setCropperShortcutAction(stopRecording);
    past = Date.now();
  } catch (error) {
    track('recording/stopped/error');
    // This prevents the button from being reset, since the recording has not yet started
    // This delay is due to internal framework delays in aperture native code
    if (error.message.includes('stopRecording')) {
      console.log('Recording not yet started, can\'t stop recording before it actually started');
      return;
    }

    dialog.showErrorBox('Recording error', error.message);
  }
};

const stopRecording = async () => {
  console.log(`Stopped recording after ${(Date.now() - past) / 1000}s`);
  track('recording/stopped');
  closeAllCroppers();
  setCropperShortcutAction();
  resetTray();

  const filePath = await aperture.stopRecording();

  const {
    recordedFps,
    hideDesktopIcons,
    doNotDisturb
  } = lastUsedSettings;

  if (hideDesktopIcons) {
    desktopIcons.show();
  }

  if (doNotDisturb && !wasDoNotDisturbAlreadyEnabled) {
    dnd.disable();
  }

  track('editor/opened/recording');

  if (recordHevc) {
    openEditorWindow(await convertToH264(filePath), {recordedFps, isNewRecording: true, originalFilePath: filePath});
  } else {
    openEditorWindow(filePath, {recordedFps, isNewRecording: true});
  }
};

module.exports = {
  startRecording,
  stopRecording,
  getAudioDevices: audioDevices
};
