'use strict';
/****************** 导入 ******************/
const exec = require('child_process').exec;
const { ipcRenderer } = require('electron');

/****************** 导出 ******************/
//获取根目录
exports.getHomeDir = (callback) => {
  getWinDisk(callback);
}
//选择目录
exports.selectObjectDir = () => {
  selectObjectDir();
}

/****************** 本地 ******************/
// show  Windows letter, to compatible Windows xp
const getWinDisk = function(callback) {
  var wmicResult;
  var command = exec('wmic logicaldisk get caption', function(err, stdout, stderr) {
      if(err || stderr) {
          console.log("root path open failed" + err + stderr);
          return;
      }
      wmicResult = stdout;
  });
  command.stdin.end();   // stop the input pipe, in order to run in windows xp
  command.on('close', function(code) {
      var data = wmicResult.replace(/ /g,"").split('\n'), result = {};
      for(let i = data.length - 1;i >= 0;i--){
        data[i] = data[i].replace(/\s/g,"");
        console.log(data[i],data[i].length);
        if(data[i].length !== 2){
          data.splice(i,1);
        }
      }
      callback(data);
      command.unref();
  });
}
// select object dir
const selectObjectDir = () => {
  
}

/****************** 立即执行 ******************/
document.addEventListener('drop', function (e) {
  e.preventDefault();
  e.stopPropagation();
  ipcRenderer.send('accept-new-dir', e.dataTransfer.files);
  // for (let f of e.dataTransfer.files) {
  //   console.log('File(s) you dragged here: ', f.path)
  //   ipcRenderer.send('accept-new-dir', f.path);
  // }
});
document.addEventListener('dragover', function (e) {
  e.preventDefault();
  e.stopPropagation();
});