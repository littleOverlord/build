'use strict';
const fs = require('fs');
const path = require('path');

const imagemin = require('imagemin');
const imageminPngquant = require('imagemin-pngquant');

const util = require('../ni/util');

exports.modify = (filename,relativePath,bcfg,cfg,callback) => {
    const info = {path:relativePath};
        callback(info);
}
exports.delete = (filename,relativePath,bcfg,cfg,callback) => {
    let info = {path: relativePath};
        callback(info);
}