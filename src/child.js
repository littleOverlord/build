'use strict';
/****************** 导入 ******************/
const fs = require('fs');
const path = require('path');

const { ipcRenderer, dialog } = require('electron');

const disk = require('./ni/disk');

/****************** 本地 ******************/
//构建实例
let child;
//构建类
class Child{
    constructor(){
        //当前打开的项目路径 string
        this.currProject  = ipcRenderer.sendSync("request","lastDir");
        /*构建配置表[
            {
                "name": "wx",
                "dist": "./dist/wx", //与打开项目的相对路径，遵循path.join
                "plugins":{
                    "ts":{
                        "mod":"ts2es6"
                    },
                    "xls":{
                        "mod":"xls2json"
                    },
                    "xlsx":{
                        "mod":"xls2json"
                    }
                }
            },
            ...]
        */
        this.buildCfg = require(`${this.currProject}/build.json`);
        this.cfgTab = {
            currNode: null,
            currCfg: '' //wx(微信) bw(浏览器) bd(百度) pc(pc端)
        };
        this.plugins = {};
        this.watcher = {};
        this.waiting = [];
        this.dirCreated = {};
        this.buildStatusCast = {
            "0": "初始化中",
            "1": "构建中",
            "5": "开始构建"
        }
        this.buildButton = document.getElementById("build");
        for(let i = 0, len = this.buildCfg.length; i < len; i++){
            this.buildCfg[i].distAbsolute = path.join(this.currProject,this.buildCfg[i].dist);
        }
        this.initTab();
        this.setBuildStatus(0);
    }
    //开始构建
    start(callback){
        //删除目标老文件夹
        this.removeOld();
        //读取所有文件，并创建目标文件目录
        this.readDir("");
        //构建
        this.build();
        callback && callback()
    }
    //监听文件
    bindWatch(dir){

    }
    //初始化构建插件
    initPlugins(callback){
        fs.readdir(`${process.cwd()}/src/plugins`,(err,files) => {
            if(err){
                return console.error(err);
            }
            for(let i = 0, len = files.length; i < len; i++){
                let modName = path.parse(files[i]).name;
                this.plugins[modName] = require(`./plugins/${modName}`);
            }
            console.log(this.plugins);
            callback && callback();
        })
    }
    //读取文件夹,创建目标文件夹
    readDir(dir){
        let files = fs.readdirSync(path.join(this.currProject,dir),"utf8"),p;
        for(let i = 0, len = files.length; i < len; i++){
            if(files[i] == ".dist"){
                continue;
            }
            p = `${dir}/${files[i]}`;
            if(this.isDir(path.join(this.currProject,p))){
                this.createDistDir(p);
                this.readDir(p); 
            }else{
               this.waiting.push(p); 
            }
        }
    }
    //判断是否文件夹
    isDir(p){
        let stat = fs.lstatSync(p);
        return stat.isDirectory();
    }
    //删除老文件夹
    removeOld(){
        for(let j = 0, leng = this.buildCfg.length; j < leng; j++){
            try{
                // fs.rmdirSync(this.buildCfg[j].distAbsolute);
                this.rmDir(this.buildCfg[j].distAbsolute)
            }catch(e){
                console.log(e.code,e.message);
            }
        }
    }
    //创建文件夹
    createDistDir(p){
        for(let j = 0, leng = this.buildCfg.length; j < leng; j++){
            this.createDir(path.join(this.buildCfg[j].distAbsolute,p));
        }
    }
    createDir(p){
        let arr = [],d;
        if(p != undefined){
            arr = p.split(/[\\/]+/);
        }
        for(let i = 1, len = arr.length; i < len; i++){
            d = arr.slice(0,i+1).join(path.sep);
            if(this.dirCreated[d]){
                continue;
            }
            try{
                fs.mkdirSync(d);
            }catch(e){
                if(e.code !== "EEXIST"){
                    console.log(e);
                }
                
            }
            this.dirCreated[d] = 1;
        }
    }
    //初始化页面选项卡
    initTab(){
        let node = document.getElementById("cfgTab"),html = '';
        for(let i = 0, len = this.buildCfg.length; i< len; i++){
            html += `<li onclick="selectCfg(${i},this)">${this.buildCfg[i].name}</li>`;
        }
        node.innerHTML = html;
    }
    //单文件构建
    build(){
        let bc;
        for(let i = 0, len = this.waiting.length; i < len; i++){
            let p = path.join(this.currProject,this.waiting[i]),
                data = fs.readFileSync(p),
                ext = path.extname(this.waiting[i]).replace(".","");
            for(let j = 0, leng = this.buildCfg.length; j < leng; j++){
                bc = this.buildCfg[j].plugins[ext];
                if(bc && this.plugins[bc.mod]){
                    this.plugins[bc.mod].modify(data,p,this.waiting[i],this.buildCfg[j].distAbsolute,bc);
                }else{
                    fs.copyFileSync(p,path.join(this.buildCfg[j].distAbsolute,this.waiting[i]))
                }
            }
        }
        this.waiting = [];
        this.dirCreated = {};
    }
    //设置构建状态
    setBuildStatus(status){
        this.buildStatus = status;
        this.buildButton.innerHTML = `${this.buildStatusCast[this.buildStatus]}`
    }
    //删除目录
    rmDir(dir){
        let arr = [dir]
        let current = null
        let index = 0
    
        while(current = arr[index++]) {
            // 读取当前文件，并做一个判断，文件目录分别处理
            let stat = fs.statSync(current)
            //如果文件是目录
            if (stat.isDirectory()) {
                //读取当前目录，拿到所有文件
                let files = fs.readdirSync(current)
                // 将文件添加到文件池
                arr = [...arr, ...files.map(file => path.join(current, file))]
            }
        }
        //遍历删除文件
        for (var i = arr.length - 1; i >= 0; i--) {
            // 读取当前文件，并做一个判断，文件目录分别处理
            let stat = fs.statSync(arr[i])
            // 目录和文件的删除方法不同
            if (stat.isDirectory()) {
                fs.rmdirSync(arr[i])
            } else {
                fs.unlinkSync(arr[i])
            }
        }
    }
}





/****************** 立即执行 ******************/
child = new Child();
console.log("new Child");
child.initPlugins(()=>{
    child.setBuildStatus(5);
});
window.selectCfg = (arg,e) => {
    child.cfgTab.currNode && child.cfgTab.currNode.setAttribute("class","");
    if(child.cfgTab.currNode == e){
        child.cfgTab.currCfg = '';
        child.cfgTab.currNode = null;
        return;
    }
    child.cfgTab.currCfg = arg;
    child.cfgTab.currNode = e;
    child.cfgTab.currNode.setAttribute("class","curr");
    console.log("selectCfg: ",arg,e,child.buildCfg);
}
window.build = (arg,e) => {
    if(child.buildStatus < 5){
        return;
    }
    child.setBuildStatus(1);
    child.start(()=>{
        child.setBuildStatus(5);
    });
}
// fs.writeFile(`${path.join(currProject,buildCfg[0].dist)}/a/b.json`,"test","utf8",(err) => {
//     console.log("write back ",err);
// })

//监听文件夹
// watcher = fs.watch(currProject, { encoding: 'utf8' }, (eventType, filename) => {
    // console.log(eventType,filename);
    // if (filename) {
    //   console.log(filename);
      // 打印: <Buffer ...>
    // }
// });