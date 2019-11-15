'use strict';
const fs = require('fs');
const path = require('path');

const babel = require("@babel/core");

const util = require('../ni/util');

exports.modify = (filename,relativePath,bcfg,pcfg,callback) => {
    let info = {path: relativePath};
    callback(info);
    
    // console.log("ts2es5",data.es5.code);
}
exports.delete = (filename,relativePath,bcfg,cfg,callback) => {
    let info = {path: relativePath};
    callback(info);
} 
