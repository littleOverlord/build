'use strict';
const fs = require('fs');
const path = require('path');

const babel = require("@babel/core");

const util = require('../ni/util');

exports.modify = (filename,relativePath,bcfg,pcfg,callback,parent) => {
    
    let state;
    try{
        state = fs.statSync(filename.replace(".vcss",".vue"));
        parent.addTask("modify",relativePath.replace(".vcss",".vue"));
    }catch(e){
        console.log(e);
    }
    
}
exports.delete = (filename,relativePath,bcfg,cfg,callback) => {
    let state;
    try{
        state = fs.statSync(filename.replace(".vcss",".vue"));
        parent.addTask("delete",relativePath.replace(".vcss",".vue"));
    }catch(e){
        console.log(e);
    }
} 