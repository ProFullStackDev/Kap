import electron from 'electron';
import React from 'react';
import PropTypes from 'prop-types';

import Item from '../../item';
import Switch from '../../item/switch';

const PluginTitle = ({title, label, onClick}) => (
  <div>
    <div
      className="plugin-title"
      onClick={onClick}
    >
      {title}
    </div>
    <span>{label}</span>
    <style jsx>{`
      .plugin-title {
        display: inline-block;
        color: #007aff;
        cursor: pointer;
      }

      .plugin-title:hover {
        text-decoration: underline;
      }

      span {
        color: gray;
        padding-left: 8px;
      }
    `}</style>
  </div>
);

PluginTitle.propTypes = {
  title: PropTypes.string,
  label: PropTypes.string,
  onClick: PropTypes.func
};

const getLink = ({homepage, links}) => homepage || (links && links.homepage);

const Plugin = ({plugin, checked, disabled, onTransitionEnd, onClick, loading}) => {
  return (
    <Item
      key={plugin.name}
      id={plugin.name}
      title={
        <PluginTitle
          title={plugin.prettyName}
          label={plugin.version}
          onClick={() => electron.shell.openExternal(getLink(plugin))}/>
      }
      subtitle={plugin.description}
    >
      <Switch
        checked={checked}
        disabled={disabled}
        loading={loading}
        onTransitionEnd={onTransitionEnd}
        onClick={onClick}/>
    </Item>
  );
};

Plugin.propTypes = {
  plugin: PropTypes.object,
  checked: PropTypes.bool,
  disabled: PropTypes.bool,
  onTransitionEnd: PropTypes.func,
  onClick: PropTypes.func,
  loading: PropTypes.bool
};

export default Plugin;
