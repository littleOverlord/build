'use strict';
const fs = require('fs');
const os = require('os');

const J = require('j');

const util = require('../ni/util');

exports.modify = (filename,relativePath,bcfg,cfg,callback) => {
    let data = J.readFile(filename)[1].Sheets,i = 1000,
        seat = new SeatMgr(),
        info = {size:1},
        r = {},
        replace = {};
    info.path = relativePath.replace(/\.xls|\.xlsx/,".json");
    info.sign = util.createHash(fs.readFileSync(filename,"utf8"));
    if(bcfg.depend.dist[info.path] && bcfg.depend.dist[info.path].sign === info.sign){
        return callback(bcfg.depend.dist[info.path]);
    }
    console.log("xls2json",filename,data);
    try{
        for(let k in data){
            r[k] = paseSheet(data[k],seat,replace);
        }
        r = JSON.stringify(r);
        for(let k in replace){
            let reg = new RegExp(k,"g");
            r = r.replace(reg,replace[k]);
        }
        info.size = r.length;
        
        fs.writeFileSync(`${path.join(bcfg.distAbsolute,info.path)}`,r,"utf8");
        callback(info);
    }catch(e){
        console.log(e);
    }
}
exports.delete = (filename,relativePath,bcfg,cfg,callback) => {
    let info = {path: relativePath.replace(/\.xls|\.xlsx/,".json")};
    util.removeAll(`${path.join(bcfg.distAbsolute,info.path)}`);
    callback(info);
} 

class SeatMgr{
    constructor(){
        this.letters = ["A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z"];
        this.nextIndex = 0;
        this.prevLetter = [];
    }
    
    next(){
        this.curr = this.prevLetter.join("") + this.letters[this.nextIndex++];
        if(this.nextIndex >= this.letters.length){
            this.nextIndex = 0;
            this.addPrev();
        } 
        return this.curr;
    } 
    reset(){
        this.nextIndex = 0;
        this.prevLetter = [];
    }
    addPrev(){
        let last = this.prevLetter[this.prevLetter.length-1],
            lastIndex = this.letters.indexOf(last);
        if(!last || lastIndex == (this.letters.length -1)){
            return this.prevLetter.push(this.letters[0]);
        }
        this.prevLetter[this.prevLetter.length-1] = this.letters[lastIndex+1];
    }
}

const paseSheet = (data,seat,replace) => {
    let keys = [],type = [],arg = [],e,r = {},id = '',rid = [],index=3,t;
    while (e = data[seat.next()+"1"]){
        if(e.v.indexOf("|") >= 0){
            t = e.v.split("|");
            type.push(t[1]);
            arg.push(t[2]);
            e.v = t[0];
        }else{
            type.push(null);
            arg.push(null);
        }
        if(e.v.indexOf("!") === 0){
            rid.push(seat.curr);
            e.v = e.v.replace("!","");
        }
        keys.push(e.v);
    }
    seat.reset();
    if(rid.length == 0){
        rid = ["A"];
    }
    while (index){
        let es = [];
        for(let i = keys.length - 1; i >= 0; i--){
            e = data[seat.next()+index];
            if(seat.curr == "A" && !e){
                break;
            }
            if(rid.indexOf(seat.curr) >= 0){
                id += e.v;
            }
            e.v = compileType(e.v, type[seat.nextIndex-1], arg[seat.nextIndex-1],replace);
            es.push(e && e.v);
        }
        seat.reset();
        index++;
        if(id){
            r[id] = es;
            id = "";
        }else{
            break;
        }
    }
    return {
        keys: keys,
        values: r
    }
}

const compileType = (v,type,arg,replace) => {
    switch(type){
        case "object":
            return JSON.parse(v);
        case "code":
            let r = `function(${arg || ""}){return ${v};}`,
                k = `"function(${arg || ""}){return ${v};}"`;
            replace[k] = r;
            return r;
        default:
         return v
    }
}