'use strict';
const fs = require('fs');
const path = require('path');

const babel = require("@babel/core");

const util = require('../ni/util');

exports.modify = (filename,relativePath,bcfg,pcfg,callback,parent) => {
    
    let state;
    try{
        state = fs.statSync(filename.replace(".tpl",".vue"));
        parent.addTask("modify",relativePath.replace(".tpl",".vue"));
    }catch(e){
        console.log(e);
    }
    
}
exports.delete = (filename,relativePath,bcfg,cfg,callback) => {
    let state;
    try{
        state = fs.statSync(filename.replace(".tpl",".vue"));
        parent.addTask("delete",relativePath.replace(".tpl",".vue"));
    }catch(e){
        console.log(e);
    }
} 