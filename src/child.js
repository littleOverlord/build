'use strict';
/****************** 导入 ******************/
const fs = require('fs');
const path = require('path');

const { ipcRenderer, dialog } = require('electron');

const { removeAll,readFileTryCatch, createHash } = require('./ni/util');

/****************** 本地 ******************/
//构建实例
let child;
//构建类
class Child{
    constructor(){
        let _this = this;
        //当前打开的项目路径 string
        this.root  = ipcRenderer.sendSync("request","lastDir");
        /*构建配置表[
            {
                "name": "wx",
                "dist": "./dist/wx", //与打开项目的相对路径，遵循path.join
                "ignore":["/README.md",...]
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
        this.first = false;
        this.buildCfg = require(`${this.root}/build.json`);
        document.head.querySelector("title").innerText = this.root;
        readFileTryCatch(`${process.cwd()}/src/cfg/depend.json`,(err,data)=>{
            // console.log(err,data);
            if(err){
                _this.first = true; 
            }
            _this.depend = err?{}:(()=>{
                let d = JSON.parse(data.replace(/\//gi,"\\\\"));
                for(let k in d){
                    d[k] = 0;
                }
                return d;
            })();
        });
        
        this.cfgTab = {
            currNode: null,
            currCfg: '' //wx(微信) bw(浏览器) bd(百度) pc(pc端)
        };
        this.plugins = {};
        this.watcher = {};
        this.tasks = {};
        this.taskCount = 0;
        this.buildCount = 0;
        this.dirCreated = {};
        //所有文件列表
        this.filesCache = {};
        //所有项目文件夹
        this.dirCache = {};
        this.buildStatusCast = {
            "0": "初始化中",
            "1": "构建中",
            "5": "构建完成"
        }
        this.infoBox = document.getElementById("info");
        for(let i = 0, len = this.buildCfg.length; i < len; i++){
            this.buildCfg[i].distAbsolute = path.join(this.root,this.buildCfg[i].dist);
            if(!this.first){
                readFileTryCatch(`${this.buildCfg[i].distAbsolute}/${this.buildCfg[i].depend.name}`,(err,data)=>{
                    let r = err?"{}":data.replace(_this.buildCfg[i].depend.prev,"").replace(_this.buildCfg[i].depend.last,"").replace(/\//gi,"\\\\");
                    _this.buildCfg[i].depend.dist = JSON.parse(r);
                    
                });
            }else{
                this.buildCfg[i].depend.dist = {};
            }
            if(this.buildCfg[i].ignore){
                for(let j = 0,leng = this.buildCfg[i].ignore.length; j < leng; j++){
                    this.buildCfg[i].ignore[j] = path.normalize(this.buildCfg[i].ignore[j]);
                }
            }
        }
        this.initTab();
        this.setBuildStatus(0);
    }
    //开始构建
    start(){
        console.log(this.buildCfg);
        console.log(this.depend);
        if(this.first){
            this.removeOld();
            this.first = false;
        }
        //读取所有文件，并创建目标文件目录
        this.readDir("");
        this.compileDepend();
        //开始构建循环
        this.loop();
    }
    //销毁
    destory(){
        clearTimeout(this.timer);
        for(let k in this.watcher){
            this.watcher[k].close();
        }
    }
    //监听文件
    watchHandler(dir){
        let _this = this;
        return (eventType, filename) => {
            console.log(eventType, filename);
            let type = "modify",
                p = path.join(dir,filename),
                isdir = (eventType == "rename" && !_this.filesCache[p] && !_this.dirCache[p])?_this.isDir(p):_this.dirCache[p];
            //判断是否文件
            if(isdir && eventType == "change"){
                return;
            }
            //新建文件夹
            if(isdir && !_this.dirCache[p]){
                return _this.readDir(p.replace(_this.root,""));
            }
            if(eventType == "rename" && _this.filesCache[p]){
                type = "delete";
            }
            _this.addTask(type,p.replace(_this.root,""));
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
            // console.log(this.plugins);
            callback && callback();
        })
    }
    //读取文件夹,创建目标文件夹
    readDir(dir){
        let ap = path.join(this.root,dir),
            files = fs.readdirSync(ap,"utf8"),
            p,fp;
        this.addWatch(ap);
        this.dirCache[ap] = files.length;
        for(let i = 0, len = files.length; i < len; i++){
            p = `${dir}${path.sep}${files[i]}`;
            fp = path.join(this.root,p);
            if(this.isDir(fp)){
                this.createDistDir(p);
                this.readDir(p); 
            }else{
            //    this.tasks.push(p); 
               this.addTask("modify",p);
               this.depend[p] = 1;
            }
        }
    }
    /**
     * @description 对比老的depend，看是否有残留文件
     */
    compileDepend(){
        for(let k in this.depend){
            if(this.depend[k] == 0){
                this.addTask("delete",k);
                delete this.depend[k];
            }
        }
    }
    /**
     * @description 写depend
     */
    writeDepend(){
        fs.writeFileSync(`${process.cwd()}/src/cfg/depend.json`,JSON.stringify(this.depend).replace(/\\\\/gi,"/"),"utf8");
        for(let i = 0, len = this.buildCfg.length; i < len; i++){
            let s = this.buildCfg[i].depend.prev + JSON.stringify(this.buildCfg[i].depend.dist) + this.buildCfg[i].depend.last;
            // console.log(s);
            fs.writeFileSync(`${this.buildCfg[i].distAbsolute}/${this.buildCfg[i].depend.name}`,s.replace(/\\\\/gi,"/"),"utf8");
            console.log("write depend ok!");
        }
    }
    //判断是否文件夹
    isDir(p){
        let stat = fs.lstatSync(p);
        return stat.isDirectory();
    }
    //判断是否忽略
    isIgnore(p,cfg){
        let rp = p.replace(this.root,""),s,d,r;
        for(let i = 0, len = cfg.ignore.length; i < len; i++){
            s = rp.split(path.sep);
            d = cfg.ignore[i].split(path.sep);
            r = true;
            for(let j = d.length - 1; j >= 0; j--){
                if(d[j] !== s[j]){
                    r = false;
                }
            }
            if(r){
                return true;
            }
        }
        return false;
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
        let wf = path.join(this.root,file);
        if(!this.tasks[wf]){
            this.taskCount += 1;
        }
        this.tasks[wf] = {type,file};
        if(type === "modify" && !this.filesCache[wf]){
            this.filesCache[wf] = 1;
            this.depend[file] = 1;
        }
        if(type === "delete" && this.filesCache[wf]){
            delete this.depend[file];
            delete this.filesCache[wf];
        }
    }
    //添加文件夹监听
    addWatch(dir){
        this.watcher[dir] = fs.watch(dir, { encoding: 'utf8' }, this.watchHandler(dir));
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
            if(this.isIgnore(p,this.buildCfg[j])){
                continue;
            }
            this.createDir(path.join(this.buildCfg[j].distAbsolute,p));
        }
    }
    //逐层创建文件夹
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
        let bc, k, t = Date.now();
        for(k in this.tasks){
            let task = this.tasks[k],
                p = path.join(this.root,task.file),
                ext = path.extname(task.file).replace(".","");
            
            this.appendBuildInfo(`build ${p}, left ${this.taskCount-1} files!`)
            for(let j = 0, leng = this.buildCfg.length; j < leng; j++){
                if(this.isIgnore(p,this.buildCfg[j])){
                    continue;
                }
                this.buildCount += 1;
                bc = this.buildCfg[j].plugins[ext];
                if(bc && this.plugins[bc.mod]){
                    this.plugins[bc.mod][task.type](p,task.file,this.buildCfg[j],bc,(result)=>{
                        this.buildCount -= 1;
                        if(!result.size){
                            return delete this.buildCfg[j].depend.dist[result.path];
                        }
                        this.buildCfg[j].depend.dist[result.path] = result;
                    });
                }else{
                    this[task.type](p,task.file,path.join(this.buildCfg[j].distAbsolute,task.file),(result)=>{
                        this.buildCount -= 1;
                        if(!result.size){
                            return delete this.buildCfg[j].depend.dist[result.path];
                        }
                        this.buildCfg[j].depend.dist[result.path] = result;
                    })
                }
            }
            this.removeTask(k);
            if(Date.now()-t >= 10){
                break;
            }
        }
    }
    //构建循环
    loop(){
        if(this.taskCount > 0 || this.buildCount > 0){
            this.setBuildStatus(1);
        }
        this.build();
        if(this.taskCount == 0 && this.buildCount == 0){
            if(this.buildStatus !== 5){
                this.writeDepend();
            }
            this.setBuildStatus(5);
        }
        this.timer = setTimeout(((_this) => {
            return () => {
                _this.loop();
            }
        })(this),50);
    }
    //复制文件
    modify(src,relative,dist,callback){
        const info = {path:relative},data = fs.readFileSync(src,"utf8");
        info.sign = createHash(data);
        info.size = data.length;
        fs.copyFileSync(src,dist);
        callback(info);
    }
    //删除文件
    delete(src,relative,dist,callback){
        removeAll(dist);
        callback({path:relative});
    }
    //设置构建状态
    setBuildStatus(status){
        if(this.buildStatus == status){
            return;
        }
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
    child.initPlugins(()=>{
        child.setBuildStatus(5);
        child.start();
    });
}


/****************** 立即执行 ******************/
//启动构建
init();
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
//重启构建，清空之前的构建
window.restart = (arg,e) => {
    child.destory();
    init();
}
// fs.writeFile(`${path.join(root,buildCfg[0].dist)}/a/b.json`,"test","utf8",(err) => {
//     console.log("write back ",err);
// })

//监听文件夹
// fs.watch(child.root, { encoding: 'utf8' }, (eventType, filename) => {
//     console.log(eventType,filename);
//     if (filename) {
//       console.log(filename);
    //   打印: <Buffer ...>
//     }
// });