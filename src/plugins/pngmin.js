'use strict';
const fs = require('fs');
const path = require('path');

const imagemin = require('imagemin');
const imageminPngquant = require('imagemin-pngquant');

exports.modify = (filename,relativePath,distPath,cfg) => {
    try{
        if(fs.lstatSync(filename.replace(".png",".json"))){
            // tinify.fromFile(filename).toFile(path.join(distPath,relativePath));
            imagemin([filename],path.join(distPath,path.parse(relativePath).dir),{
                plugins: [
                    imageminPngquant({quality: `${cfg.quality}-${cfg.quality}`})
                ]
            })
        }
    }catch(e){
        console.log(`Skip modify ${filename}`,e.message);
    }
}
exports.delete = (filename,relativePath,distPath,cfg) => {
    try{
        if(fs.lstatSync(filename.replace(".png",".json"))){
            removeAll(path.join(distPath,path.parse(relativePath).dir));
        }
    }catch(e){
        console.log(`Skip delete ${filename}`,e.message);
    }
}