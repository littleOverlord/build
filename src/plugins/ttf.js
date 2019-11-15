'use strict';
const fs = require('fs');
const path = require('path');

const Fontmin = require('fontmin');

const util = require('../ni/util');

exports.modify = (filename,relativePath,bcfg,pcfg,callback) => {
    let fontmin,text,info = {path: relativePath};
    try{
        text = fs.readFileSync(filename.replace(".ttf",".txt"));
        fontmin = new Fontmin()
            .src(filename) // 设置服务端源字体文件
            .dest(`${path.join(bcfg.distAbsolute,path.dirname(info.path))}`) // 设置生成字体的目录
            .use(Fontmin.glyph({ 
                text: text, // 设置需要的自己
            }));

        fontmin.run(function (err, files) { // 生成字体
            if (err) {
                throw err;
            }
            console.log(files[0]); // 返回生成字体结果的Buffer文件
            info.size = files[0].stat.size;
            callback(info);
        });
        
    }catch(e){
        console.log(e);
        callback(info);
    }
    
    // console.log("ts2es5",data.es5.code);
}
exports.delete = (filename,relativePath,bcfg,cfg,callback) => {
    let info = {path: relativePath};
    util.removeAll(`${path.join(bcfg.distAbsolute,info.path)}`);
    callback(info);
} 