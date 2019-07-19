'use strict';
const fs = require('fs');
const path = require('path');

const babel = require("@babel/core");

const util = require('../ni/util');

exports.modify = (filename,relativePath,bcfg,pcfg,callback) => {
    let data = fs.readFileSync(filename),info = {path: relativePath.replace(".es5",".js")};
    try{
        data = data.toString();
        info.sign = util.createHash(data);
        if(bcfg.depend.dist[info.path] && bcfg.depend.dist[info.path].sign === info.sign){
            return callback(bcfg.depend.dist[info.path]);
        }
        info.depends = util.findDepends(data,info.path);
        data = {code:data};
        // data.es5 = babel.transform(data.code, {
        //     filename,
        //     presets: [["@babel/preset-env",{"targets": "> 0.25%, not dead"}]],
        //     plugins:[["@babel/plugin-proposal-class-properties",{"loose": true,"modules":"commonjs"
        // }]]
        // })
        // data.es5 = babel.transform(data.es6.code,{
        //     presets: [["@babel/preset-env",{"targets": "> 0.25%, not dead"}]]
        // })
        data.code = findRequire(bcfg.distAbsolute,path.join(bcfg.distAbsolute,info.path),data.code);
        data.code = `define("${path.normalize(relativePath).replace(".es5","").replace(/\\/gi,"/").replace("/","")}",function(require,exports,module){\n${data.code}\n})`;
        info.size = data.code.length;
        fs.writeFileSync(`${path.join(bcfg.distAbsolute,info.path)}`,data.code,"utf8");
        callback(info);
    }catch(e){
        console.log(e,filename);
    }
    
    // console.log("ts2es5",data.es5.code);
}
exports.delete = (filename,relativePath,bcfg,cfg,callback) => {
    let info = {path: relativePath.replace(".es6",".js")};
    util.removeAll(`${path.join(bcfg.distAbsolute,info.path)}`);
    callback(info);
} 
const findRequire = (root,p,str) => {
    let u = path.parse(p),
        r = str.match(/require\((.+)\)/g),dr,da;
    if(r){
        for(let i = 0, len = r.length; i < len; i++){
            dr = r[i].match(/"(.+)"/)[1];
            da = path.join(u.dir,dr);
            str = str.replace(`require("${dr}")`,`require("${path.normalize(path.relative(root,da)).replace(/\\/gi,"/")}")`);
        }
    }
    
    return str;
    console.log(r);
}