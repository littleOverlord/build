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
        data = babel.transform(data, {
            filename,
            presets: ['@babel/preset-typescript']
        })
        // data.es5 = babel.transform(data.code,{
        //     presets: ["@babel/preset-env"]
        // })
        info.size = data.code.length;
        fs.writeFileSync(`${path.join(bcfg.distAbsolute,info.path)}`,data.code,"utf8");
        callback(info);
    }catch(e){
        console.log(e);
    }
    
    // console.log("ts2es5",data.es5.code);
}
exports.delete = (filename,relativePath,bcfg,cfg,callback) => {
    let info = {path: relativePath.replace(".ts",".js")};
    util.removeAll(`${path.join(bcfg.distAbsolute,info.path)}`);
    callback(info);
} 
