'use strict';
const exec = require('child_process').exec;


// show  Windows letter, to compatible Windows xp
let winHome;
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
    });
}

getWinDisk(function(r){
  winHome = r;
});

exports.getHomeDir = function(){
  return winHome;
}