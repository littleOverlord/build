'use strict';
/****************** 导入 ******************/
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
/****************** 导出 ******************/
//删除文件或者文件夹（包括子文件和子目录）
exports.removeAll = function(path) {
    var files = [];
    console.log(path);
    if( fs.existsSync(path) ) {
        if(!fs.statSync(path).isDirectory()){
            return fs.unlinkSync(path);
        }
        files = fs.readdirSync(path);
        files.forEach(function(file,index){
            var curPath = path + "/" + file;
            if(fs.statSync(curPath).isDirectory()) { // recurse
                try{
                    exports.removeAll(curPath);
                }catch(e){
                    console.log(e);
                }
                
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
};
/**
 * @description 计算字符串哈希
 */
exports.createHash = (data) => {
    const hash = crypto.createHash('sha256');
    hash.update(data);
    return hash.digest('hex');
}
/**
 * @description 同步异常捕获读取文件
 */
exports.readFileTryCatch = (_path,callback) => {
    let data = "";
    try{
        data = fs.readFileSync(_path,"utf8");
        callback(null,data);
    }catch(e){
        callback(e,null);
    }
}
/**
 * @description 查找es6||ts模块的依赖
 * @param data 文件数据
 * @param fp 文件路径
 */
exports.findDepends = (data,fp) => {
    let m = data.match(/(import.+['"].+['"])/g),
        pfObj = path.parse(fp),
        pp,
        r = [];
    
    if(!m){
        return r;
    }
    for(let i = 0, len = m.length;i<len; i++){
        pp = m[i].match(/[\'\"].+[\'\"]/)[0].replace(/'|"/g,"")+".js";
        pp = path.join(pfObj.dir,pp);
        
        if(r.indexOf(pp) >= 0){
            continue;
        }
        r.push(pp);
    }
    return r;
}
/****************** 本地 ******************/

/****************** 立即执行 ******************/
