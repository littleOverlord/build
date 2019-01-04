'use strict';
const fs = require('fs');
const os = require('os');

const J = require('j');

exports.modify = (filename,relativePath,distPath,cfg) => {
    let data = J.readFile(filename)[1].Sheets,i = 1000,
        seat = new SeatMgr(),
        r = {};
    console.log("xls2json",filename,data);
    try{
        for(let k in data){
            r[k] = paseSheet(data[k],seat);
        }
        fs.writeFileSync(`${path.join(distPath,relativePath.replace(/\.xls|\.xlsx/,".json"))}`,JSON.stringify(r),"utf8");
    }catch(e){
        console.log(e);
    }
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

const paseSheet = (data,seat) => {
    let keys = [],type = [],e,r = {},id = '',rid = [],index=3,t;
    while (e = data[seat.next()+"1"]){
        if(e.v.indexOf("|") >= 0){
            t = e.v.split("|");
            type.push(t[1]);
            e.v = t[0];
        }else{
            type.push(null);
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
            if(type[seat.nextIndex-1] == "object"){
                e.v = JSON.parse(e.v);
            }
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