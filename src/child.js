'use strict';
const fs = require('fs');
const path = require('path');

const { ipcRenderer, dialog } = require('electron');

const disk = require('./ni/disk');


const currProject  = ipcRenderer.sendSync("request","lastDir");



/****************** 立即执行 ******************/
