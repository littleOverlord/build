'use strict';
const fs = require('fs');
const os = require('os');

const babel = require("@babel/core");

exports.modify = (data,relativePath,distPath,cfg) => {
    try{
        data = data.toString();
        data = babel.transformSync(data, {
            presets: ['@babel/preset-typescript']
        })
    }catch(e){
        console.log(e);
    }
    
    console.log("ts2es5",relativePath,distPath,data,cfg);
}