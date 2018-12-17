'use strict';
const fs = require('fs');
const path = require('path');

const { ipcRenderer } = require('electron');



/****************** 本地 ******************/
let projects = ipcRenderer.sendSync("request","historyProjects"),
  projectsNode = document.getElementById('projects');

console.log(process.cwd())
// ipcRenderer.addListener("historyProjects",(event, arg) => {
//   console.log("main projects-history",event,arg);
// })
const addProjects = () => {
  let s = '';
  for(let i = 0, len = projects.length;i < len; i++){
    s += `<li onclick="selectOne('${projects[i]}')">${projects[i]}</li>`
  }
  projectsNode.innerHTML = s;
}

/****************** 立即执行 ******************/
//初始化项目列表
addProjects();
//绑定项目选择监听
window.selectOne = (dir) => {
  ipcRenderer.send('accept-new-dir',[dir]);
}
//选择新项目
window.openDir = () => {
  // disk.selectObjectDir();
  ipcRenderer.send("request",'openDir');
}