'use strict';
/****************** 导入 ******************/
const fs = require('fs');
const crypto = require('crypto');
/****************** 导出 ******************/
//删除文件或者文件夹（包括子文件和子目录）
exports.removeAll = (p) => {
  let arr = [p];
  let current = null;
  let index = 0;

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

exports.createHash = (data) => {
    const hash = crypto.createHash('sha256');
    hash.update(data);
    return hash.digest('hex');
}

/****************** 本地 ******************/

/****************** 立即执行 ******************/
