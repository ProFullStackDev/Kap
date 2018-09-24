import electron from 'electron';
import React from 'react';
import PropTypes from 'prop-types';
import tildify from 'tildify';

import {connect, PreferencesContainer} from '../../../containers';

import Item from '../item';
import Switch from '../item/switch';
import Button from '../item/button';
import Select from '../item/select';
import ShortcutInput from '../shortcut-input';

import Category from './category';

class Settings extends React.Component {
  static defaultProps = {
    audioDevices: [],
    kapturesDir: ''
  }

  openKapturesDir = () => {
    electron.shell.openItem(this.props.kapturesDir);
  }

  render() {
    const {
      kapturesDir,
      openOnStartup,
      allowAnalytics,
      showCursor,
      highlightClicks,
      hideDesktopIcons,
      doNotDisturb,
      record60fps,
      recordKeyboardShortcut,
      loopExports,
      toggleSetting,
      audioInputDeviceId,
      setAudioInputDeviceId,
      audioDevices,
      recordAudio,
      pickKapturesDir,
      setOpenOnStartup,
      cropperShortcut,
      updateShortcut,
      toggleShortcuts
    } = this.props;

    const devices = audioDevices.map(device => ({
      label: device.name,
      value: device.id
    }));

    const kapturesDirPath = tildify(kapturesDir);

    const fpsOptions = [{label: '30 FPS', value: false}, {label: '60 FPS', value: true}];

    return (
      <Category>
        <Item
          title="Show cursor"
          subtitle="Display the mouse cursor in your Kaptures"
        >
          <Switch
            checked={showCursor}
            onClick={
              () => {
                if (showCursor) {
                  toggleSetting('highlightClicks', false);
                }
                toggleSetting('showCursor');
              }
            }/>
        </Item>
        <Item subtitle="Highlight clicks">
          <Switch
            checked={highlightClicks}
            disabled={!showCursor}
            onClick={() => toggleSetting('highlightClicks')}
          />
        </Item>
        <Item
          title="Keyboard shortcuts"
          subtitle="Toggle and customise keyboard shortcuts"
        >
          <Switch checked={recordKeyboardShortcut} onClick={toggleShortcuts}/>
        </Item>
        {recordKeyboardShortcut && (
          <Item subtitle="Trigger Kap">
            <ShortcutInput {...cropperShortcut} onChange={shortcut => updateShortcut('cropperShortcut', shortcut)}/>
          </Item>
        )}
        <Item
          title="Hide desktop icons"
          subtitle="Temporarily hide desktop icons while recording"
        >
          <Switch checked={hideDesktopIcons} onClick={() => toggleSetting('hideDesktopIcons')}/>
        </Item>
        <Item
          title="Silence notifications"
          subtitle="Activate “Do Not Disturb” while recording"
        >
          <Switch checked={doNotDisturb} onClick={() => toggleSetting('doNotDisturb')}/>
        </Item>
        <Item
          title="Loop exports"
          subtitle="Infinitely loop exports when supported"
        >
          <Switch checked={loopExports} onClick={() => toggleSetting('loopExports')}/>
        </Item>
        <Item
          title="Audio recording"
          subtitle="Record audio from input device"
        >
          <Switch
            checked={recordAudio}
            onClick={() => toggleSetting('recordAudio')}/>
        </Item>
        <Item subtitle="Select input device">
          <Select
            options={devices}
            selected={audioInputDeviceId}
            placeholder="Select Device"
            noOptionsMessage="No input devices"
            onSelect={setAudioInputDeviceId}/>
        </Item>
        <Item
          title="Capture frame rate"
          subtitle="Increased FPS impacts performance and file size"
        >
          <Select
            options={fpsOptions}
            selected={record60fps}
            onSelect={value => toggleSetting('record60fps', value)}/>
        </Item>
        <Item title="Allow analytics" subtitle="Help us improve Kap by sending anonymous usage stats">
          <Switch checked={allowAnalytics} onClick={() => toggleSetting('allowAnalytics')}/>
        </Item>
        <Item title="Start automatically" subtitle="Launch Kap on system startup">
          <Switch checked={openOnStartup} onClick={setOpenOnStartup}/>
        </Item>
        <Item title="Save to…" subtitle={kapturesDirPath} tooltip={kapturesDir} onSubtitleClick={this.openKapturesDir}>
          <Button title="Choose" onClick={pickKapturesDir}/>
        </Item>
      </Category>
    );
  }
}

Settings.propTypes = {
  showCursor: PropTypes.bool,
  highlightClicks: PropTypes.bool,
  hideDesktopIcons: PropTypes.bool,
  doNotDisturb: PropTypes.bool,
  record60fps: PropTypes.bool,
  recordKeyboardShortcut: PropTypes.bool,
  toggleSetting: PropTypes.func.isRequired,
  audioInputDeviceId: PropTypes.string,
  setAudioInputDeviceId: PropTypes.func.isRequired,
  audioDevices: PropTypes.array,
  recordAudio: PropTypes.bool,
  kapturesDir: PropTypes.string,
  openOnStartup: PropTypes.bool,
  allowAnalytics: PropTypes.bool,
  loopExports: PropTypes.bool,
  pickKapturesDir: PropTypes.func.isRequired,
  setOpenOnStartup: PropTypes.func.isRequired,
  updateShortcut: PropTypes.func.isRequired,
  toggleShortcuts: PropTypes.func.isRequired,
  cropperShortcut: PropTypes.shape({
    metaKey: PropTypes.bool.isRequired,
    altKey: PropTypes.bool.isRequired,
    ctrlKey: PropTypes.bool.isRequired,
    shiftKey: PropTypes.bool.isRequired,
    character: PropTypes.string.isRequired
  })
};

export default connect(
  [PreferencesContainer],
  ({
    showCursor,
    highlightClicks,
    hideDesktopIcons,
    doNotDisturb,
    record60fps,
    recordAudio,
    recordKeyboardShortcut,
    audioInputDeviceId,
    audioDevices,
    kapturesDir,
    openOnStartup,
    allowAnalytics,
    loopExports,
    cropperShortcut
  }) => ({
    showCursor,
    highlightClicks,
    hideDesktopIcons,
    doNotDisturb,
    record60fps,
    recordAudio,
    recordKeyboardShortcut,
    audioInputDeviceId,
    audioDevices,
    kapturesDir,
    openOnStartup,
    allowAnalytics,
    loopExports,
    cropperShortcut
  }),
  ({
    toggleSetting,
    setAudioInputDeviceId,
    pickKapturesDir,
    setOpenOnStartup,
    updateShortcut,
    toggleShortcuts
  }) => ({
    toggleSetting,
    setAudioInputDeviceId,
    pickKapturesDir,
    setOpenOnStartup,
    updateShortcut,
    toggleShortcuts
  })
)(Settings);
