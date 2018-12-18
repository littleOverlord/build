'use strict';
/****************** 导入 ******************/
const fs = require('fs');
const path = require('path');

const { ipcRenderer, dialog } = require('electron');

const disk = require('./ni/disk');

/****************** 本地 ******************/
const currProject  = ipcRenderer.sendSync("request","lastDir");
const buildCfg = require(`${currProject}/build.json`);

const cfgTab = {
    currNode: null,
    currCfg: '' //wx(微信) bw(浏览器) bd(百度) pc(pc端)
},
    plugins = {};
let watcher;

/****************** 立即执行 ******************/
window.selectCfg = (arg,e) => {
    cfgTab.currNode && cfgTab.currNode.setAttribute("class","");
    if(cfgTab.currNode == e){
        cfgTab.currCfg = '';
        cfgTab.currNode = null;
        return;
    }
    cfgTab.currCfg = arg;
    cfgTab.currNode = e;
    cfgTab.currNode.setAttribute("class","curr");
    console.log("selectCfg: ",arg,e,buildCfg);
}
console.log(path.join(currProject,buildCfg[0].dist));
fs.writeFile(`${path.join(currProject,buildCfg[0].dist)}/a/b.json`,"test","utf8",(err) => {
    console.log("write back ",err);
})
//初始化构建插件
fs.readdir(`${process.cwd()}/src/plugins`,(err,files) => {
    if(err){
        return console.error(err);
    }
    for(let i = 0, len = files.length; i < len; i++){
        let modName = path.parse(files[i]).name;
        plugins[modName] = require(`./plugins/${modName}`);
    }
    console.log(plugins);
})
//监听文件夹
watcher = fs.watch(currProject, { encoding: 'utf8' }, (eventType, filename) => {
    console.log(eventType,filename);
    // if (filename) {
    //   console.log(filename);
      // 打印: <Buffer ...>
    // }
});