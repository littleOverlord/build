'use strict';
const fs = require('fs');
const path = require('path');

const babel = require("@babel/core");

const util = require('../ni/util');

exports.modify = (filename,relativePath,bcfg,pcfg,callback) => {
    let data = fs.readFileSync(filename),info = {path: relativePath.replace(".ts",".js")};
    try{
        data = data.toString();
        info.sign = util.createHash(data);
        if(bcfg.depend.dist[info.path] && bcfg.depend.dist[info.path].sign === info.sign){
            return callback(bcfg.depend.dist[info.path]);
        }
        info.depends = util.findDepends(data,info.path);
        data = {code:data};
        data.es6 = babel.transform(data.code, {
            filename,
            presets: [['@babel/preset-typescript']]
        })
        // data.es5 = babel.transform(data.es6.code,{
        //     presets: [["@babel/preset-env",{"targets": "> 0.25%, not dead"}]]
        // })
        info.size = data.es6.code.length;
        fs.writeFileSync(`${path.join(bcfg.distAbsolute,info.path)}`,data.es6.code,"utf8");
        callback(info);
    }catch(e){
        console.log(e);
    }
}
exports.delete = (filename,relativePath,bcfg,cfg,callback) => {
    let info = {path: relativePath.replace(".ts",".js")};
    util.removeAll(`${path.join(bcfg.distAbsolute,info.path)}`);
    callback(info);
} 
