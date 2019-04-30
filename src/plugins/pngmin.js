'use strict';
const fs = require('fs');
const path = require('path');

const imagemin = require('imagemin');
const imageminPngquant = require('imagemin-pngquant');

const util = require('../ni/util');

exports.modify = (filename,relativePath,bcfg,cfg,callback) => {
    const info = {path:relativePath};
    try{
        if(fs.lstatSync(filename.replace(/\.png/,".json"))){
            info.sign = util.createHash(fs.readFileSync(filename,"utf8"));
            if(bcfg.depend.dist[info.path] && bcfg.depend.dist[info.path].sign === info.sign){
                return callback(bcfg.depend.dist[info.path]);
            }
            // tinify.fromFile(filename).toFile(path.join(bcfg.distAbsolute,relativePath));
            imagemin([filename],path.join(bcfg.distAbsolute,path.parse(relativePath).dir),{
                plugins: [
                    imageminPngquant({quality: `30-${cfg.quality}`})
                ]
            }).then((r)=>{
                info.size = r[0].data.length;
                callback(info);
                console.log("minimg ok:",relativePath);
            })
            console.log("minimg start:",relativePath);
        }else{
            console.log(`Skip modify ${filename}`);
            callback(info);
        }
        
    }catch(e){
        console.log(`Skip modify ${filename}`,e.message);
        callback(info);
    }
}
exports.delete = (filename,relativePath,bcfg,cfg,callback) => {
    let info = {path: relativePath};
    try{
        if(fs.lstatSync(filename.replace(/\.png/,".json"))){
            removeAll(path.join(bcfg.distAbsolute,path.parse(relativePath).dir));
            callback(info);
        }
    }catch(e){
        console.log(`Skip delete ${filename}`,e.message);
        callback(info);
    }
}