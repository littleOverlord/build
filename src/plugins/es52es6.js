'use strict';
const fs = require('fs');
const path = require('path');

const babel = require("@babel/core");

const util = require('../ni/util');

exports.modify = (filename,relativePath,bcfg,pcfg,callback) => {
    let data = fs.readFileSync(filename),info = {path: relativePath.replace(".es5",".js")};
    try{
        data = data.toString();
        info.sign = util.createHash(data);
        if(bcfg.depend.dist[info.path] && bcfg.depend.dist[info.path].sign === info.sign){
            return callback(bcfg.depend.dist[info.path]);
        }
        info.depends = util.findDepends(data,info.path);
        info.size = data.length;
        fs.copyFileSync(filename,`${path.join(bcfg.distAbsolute,info.path)}`);
        callback(info);
    }catch(e){
        console.log(e);
    }
    
    // console.log("ts2es5",data.es5.code);
}
exports.delete = (filename,relativePath,bcfg,cfg,callback) => {
    let info = {path: relativePath.replace(".es6",".js")};
    util.removeAll(`${path.join(bcfg.distAbsolute,info.path)}`);
    callback(info);
} 