'use strict';
const fs = require('fs');
const path = require('path');

const babel = require("@babel/core");

const { removeAll } = require('../ni/util');

exports.modify = (filename,relativePath,distPath,cfg) => {
    let data = fs.readFileSync(filename);
    try{
        data = data.toString();
        data = babel.transform(data, {
            filename,
            presets: ['@babel/preset-typescript']
        })
        // data.es5 = babel.transform(data.code,{
        //     presets: ["@babel/preset-env"]
        // })
        fs.writeFileSync(`${path.join(distPath,relativePath.replace(".ts",".js"))}`,data.code,"utf8");
    }catch(e){
        console.log(e);
    }
    
    // console.log("ts2es5",data.es5.code);
}
exports.delete = (filename,relativePath,distPath,cfg) => {
    removeAll(`${path.join(distPath,relativePath.replace(".ts",".js"))}`)
}