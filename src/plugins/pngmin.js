'use strict';
const fs = require('fs');
const path = require('path');

const imagemin = require('imagemin');
const imageminPngquant = require('imagemin-pngquant');

exports.modify = (data,filename,relativePath,distPath,cfg) => {
    try{
        if(fs.lstatSync(filename.replace(".png",".json"))){
            console.log(filename,path.join(distPath,path.parse(relativePath).dir));
            // tinify.fromFile(filename).toFile(path.join(distPath,relativePath));
            imagemin([filename],path.join(distPath,path.parse(relativePath).dir),{
                plugins: [
                    imageminPngquant({quality: `${cfg.quality}-100`})
                ]
            })
        }
    }catch(e){
        console.log(e);
    }
    
    console.log("png");
}