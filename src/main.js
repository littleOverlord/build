'use strict';
const fs = require('fs');
const path = require('path');

const disk = require('./ni/disk');

const nodes = (function(){
  let ns = {},
    selects = document.querySelectorAll('div[id]');
  for(let i = 0, len = selects.length; i < len; i++){
    ns[selects[i].id] = selects[i];
  }
  return ns;
})();
let home,
  currPath = [];

const createList = function(arr){
  console.log(arr);
  let str = "<ul>";
  for(let i = 0,len = arr.length; i < len; i++){
    str += `<li onclick="selectDir('${arr[i]}')">${arr[i]}</li>`
  }
  str += "</ul>";
  return str;
}
const filterFile = function(p){
  let r = fs.readdirSync(p),cp;
  for(let i = r.length - 1; i >= 0; i--){
    cp = `${p}\\${r[i]}`;
    if(!fs.existsSync(cp) || !fs.statSync(cp).isDirectory()){
      r.splice(i,1);
    }
  }
  return r;
}

window.openDir = function(){
  if(!home){
    home = disk.getHomeDir() || filterFile("/");
  }
  nodes.selectButton.setAttribute("style","display:none;");
  nodes.selectDir.setAttribute("style","display:block;");
  nodes.currPath.innerHTML = currPath.join('\\');
  nodes.dirList.innerHTML = createList(home);
};
window.selectDir = function(dir){
  let fore = currPath.join('\\');
  fore += fore?"\\":"";
  currPath.push(dir);
  nodes.currPath.innerHTML = currPath.join('\\');
  nodes.dirList.innerHTML = createList(filterFile(fore+dir));
}
window.selectOk = function(){

}