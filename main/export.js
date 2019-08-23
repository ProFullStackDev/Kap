'use strict';

const path = require('path');
const PCancelable = require('p-cancelable');
const moment = require('moment');

const {track} = require('./common/analytics');
const {convertTo} = require('./convert');
const ShareServiceContext = require('./share-service-context');
const Plugin = require('./plugin');

class Export {
  constructor(options) {
    this.exportOptions = options.exportOptions;
    this.inputPath = options.inputPath;
    this.previewPath = options.previewPath;
    this.pluginName = options.pluginName;
    this.plugin = new Plugin(options.pluginName);
    this.service = this.plugin.getSerivce(options.serviceTitle);
    this.format = options.format;
    this.image = '';
    this.isDefault = options.isDefault;
    this.disableOutputActions = false;

    const now = moment();
    this.defaultFileName = options.isNewRecording ? `Kapture ${now.format('YYYY-MM-DD')} at ${now.format('H.mm.ss')}.${this.format}` : `${path.parse(this.inputPath).name}.${this.format}`;

    this.context = new ShareServiceContext({
      _isBuiltin: this.plugin._isBuiltin,
      format: this.format,
      defaultFileName: this.defaultFileName,
      config: this.plugin.config,
      onCancel: this.cancel.bind(this),
      onProgress: this.setProgress.bind(this),
      convert: this.convert.bind(this),
      pluginName: this.pluginName
    });

    this.run = this.run.bind(this);
  }

  get data() {
    return {
      defaultFileName: this.isDefault ? path.basename(this.context.targetFilePath) : this.defaultFileName,
      text: this.text,
      status: this.status,
      percentage: this.percentage,
      image: this.image,
      createdAt: this.createdAt,
      filePath: this.filePath && (this.isDefault ? this.context.targetFilePath : this.filePath),
      error: this.error,
      disableOutputActions: this.disableOutputActions
    };
  }

  run() {
    track(`export/started/${this.pluginName}`);
    return new PCancelable(async (resolve, reject, onCancel) => {
      this.resolve = resolve;
      this.reject = reject;

      onCancel(() => this.context.clear());
      try {
        await this.service.action(this.context);
        if (!this.canceled) {
          this.updateExport({
            text: 'Export completed',
            status: 'completed',
            percentage: undefined
          });
        }

        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  cancel() {
    this.updateExport({
      text: 'Export canceled',
      status: 'canceled',
      percentage: undefined
    });
    this.canceled = true;

    if (this.resolve) {
      this.context.clear();

      if (this.convertProcess) {
        this.convertProcess.cancel();
      }

      this.resolve();
    }
  }

  setProgress(text, percentage = 0) {
    this.updateExport({
      text, percentage,
      status: 'processing'
    });
  }

  async convert({fileType} = {}) {
    if (fileType) {
      this.disableOutputActions = true;
    }

    this.convertProcess = convertTo(
      {
        ...this.exportOptions,
        defaultFileName: fileType ? `${path.parse(this.defaultFileName).name}.${fileType}` : this.defaultFileName,
        inputPath: this.inputPath,
        onProgress: percentage => this.setProgress('Converting…', percentage)
      },
      fileType || this.format
    );

    this.filePath = await this.convertProcess;
    this.resolve();
    return this.filePath;
  }
}

module.exports = Export;
