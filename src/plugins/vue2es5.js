'use strict';
const fs = require('fs');
const path = require('path');

const babel = require("@babel/core");

const util = require('../ni/util');

exports.modify = (filename,relativePath,bcfg,pcfg,callback) => {
    let data = readStr(filename),tpl = readStr(filename.replace(".vue",".tpl")),css = readStr(filename.replace(".vue",".vcss")),info = {path: relativePath.replace(".vue",".js")};
    try{
        data = mergeTpl(info.path,data,tpl);
        data = mergeCss(info.path,data,css);
        info.sign = util.createHash(data);
        if(bcfg.depend.dist[info.path] && bcfg.depend.dist[info.path].sign === info.sign){
            return callback(bcfg.depend.dist[info.path]);
        }
        info.depends = util.findDepends(data,info.path);
        data = {code:data};
        data.es5 = babel.transform(data.code, {
            filename:filename.replace(".vue",".ts"),
            presets: [['@babel/preset-typescript'],["@babel/preset-env",{"targets": "> 0.25%, not dead"}]],
            plugins:[["@babel/plugin-proposal-class-properties",{"loose": true,"modules":"commonjs"
        }]]
        })
        
        data.es5.code = findRequire(bcfg.distAbsolute,path.join(bcfg.distAbsolute,info.path),data.es5.code);
        data.es5.code = `define("${path.normalize(relativePath).replace(".vue","").replace(/\\/gi,"/").replace("/","")}",function(require,exports,module){\n${data.es5.code}\n})`;
        info.size = data.es5.code.length;
        fs.writeFileSync(`${path.join(bcfg.distAbsolute,info.path)}`,data.es5.code,"utf8");
        callback(info);
    }catch(e){
        console.log(e);
        callback(info);
    }
    
    // console.log("ts2es5",data.es5.code);
}
exports.delete = (filename,relativePath,bcfg,cfg,callback) => {
    let info = {path: relativePath.replace(".vue",".js")};
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
const readStr = (path) => {
    let data;
    try{
        data = fs.readFileSync(path);
        data = data.toString();
        return data;
    }catch(e){
        console.log(e);
        return ""
    }
}
const mergeTpl = (p,code,tpl) => {
    if(!tpl){
        return code;
    }
    tpl = babel.transform(tpl, {
        presets: [],
        plugins: ["@vue/babel-plugin-transform-vue-jsx"]
    })
    let vp = path.relative(path.dirname(p),"/libs/vue");
    console.log(p);
    if(code.indexOf("import Vue from") == -1){
        code = `import Vue from "${vp.replace(/\\/gi,"/")}";\n`+code;
    }
    code += `\n$$Component.render = function(h){
        return ${tpl.code};
    };
Vue.component("${p.replace(".js","").match(/([^\/|\\|\\\\]+)/g).join("-")}",$$Component);\n`
    return code;
}
const mergeCss = (p,code,css) => {
    if(!css){
        return code;
    }
    let cp = path.relative(path.dirname(p),"/libs/css-loader");
    console.log(cp);
    code = `import CssLoader from "${cp.replace(/\\/gi,"/")}";\n`+code;
    code += "CssLoader(`"+css+"`)";
    return code;
}