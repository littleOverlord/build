'use strict';
/****************** 导入 ******************/
const fs = require('fs');
const path = require('path');

const { ipcRenderer, dialog } = require('electron');

const { removeAll } = require('./ni/util');

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
        this.tasks = {};
        this.taskCount = 0;
        this.dirCreated = {};
        this.buildStatusCast = {
            "0": "初始化中",
            "1": "构建中",
            "5": "构建完成"
        }
        this.infoBox = document.getElementById("info");
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
    //销毁
    destory(){
        for(let k in this.watcher){
            this.watcher[k].close();
        }
    }
    //监听文件
    watchHandler(dir){
        let _this = this;
        return (eventType, filename) => {
            type = "modify";
            if(eventType == "rename" && _this.watcher[filename]){
                type = "delete";
            }
            _this.addTask(type,filename.replace(_this.currProject,""));
        }
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
            //    this.tasks.push(p); 
               this.addTask("modify",p);
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
                removeAll(this.buildCfg[j].distAbsolute)
            }catch(e){
                console.log(e.code,e.message);
            }
        }
    }
    //添加到任务池
    //@param type "modify" "delete"
    addTask(type,file){
        let wf = path.join(this.currProject,file);
        if(!this.tasks[wf]){
            this.taskCount += 1;
        }
        this.tasks[wf] = {type,file};
        if(type === "modify" && !this.watcher[wf]){
            this.watcher[wf] = fs.watch(currProject, { encoding: 'utf8' }, this.watchHandler());
        }
        if(type === "delete" && this.watcher[wf]){
            this.watcher[wf].close();
            delete this.watcher[wf];
        }
    }
    //移除任务
    removeTask(key){
        delete this.tasks[key];
        this.taskCount -= 1;
        return this.taskCount;
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
        let bc, k;
        for(k in this.tasks){
            let task = this.tasks[k],
                p = path.join(this.currProject,task.file),
                data = fs.readFileSync(p),
                ext = path.extname(task.file).replace(".","");
            this.appendBuildInfo(`build ${p}, left ${this.taskCount-1} files!`)
            for(let j = 0, leng = this.buildCfg.length; j < leng; j++){
                bc = this.buildCfg[j].plugins[ext];
                if(bc && this.plugins[bc.mod]){
                    this.plugins[bc.mod][task.type](data,p,task.file,this.buildCfg[j].distAbsolute,bc);
                }else{
                    this[task.type](p,path.join(this.buildCfg[j].distAbsolute,task.file))
                }
                
            }
            break;
        }
        if(this.removeTask(k) == 0){
            this.setBuildStatus(5);
        }
    }
    loop(){
        this.timer = setTimeout(((_this) => {
            return () => {
                _this.build();
            }
        })(this),1);
    }
    //复制文件
    modify(src,dist){
        fs.copyFileSync(src,dist);
    }
    //删除文件
    delete(src,dist){
        removeAll(dist);
    }
    //设置构建状态
    setBuildStatus(status){
        this.buildStatus = status;
        this.infoBox.innerHTML = `${this.buildStatusCast[this.buildStatus]}`
    }
    //在页面上添加构建信息
    appendBuildInfo(str){
        let nd = document.createElement("p");
        nd.innerText = str;
        this.infoBox.appendChild(nd);
    }
}

const init = () => {
    child = new Child();
    console.log("new Child");
    child.initPlugins(()=>{
        child.setBuildStatus(5);
    });
}



/****************** 立即执行 ******************/

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
window.restart = (arg,e) => {
    child.destory();
    init();
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