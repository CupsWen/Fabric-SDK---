'use strict'
/**
 * @Author: cups
 * @Description:
 * @File:  messageQueue
 * @Version: 1.0.0
 * @Date: 2020/10/23 15:20
 **/


const MAXLEN = 2000;
class MessageQueue {
    // 构造函数
    constructor() {
        this.messageList=[];
        this.top=0;
    }

    // 添加
    Push(message){
        this.messageList.push(message);
    }

    // 取出
    Pop() {
        if (this.top < MAXLEN) {
            this.top += 1;
            return this.messageList[this.top-1]
        }else {
            this.messageList = this.messageList.splice(this.top, this.messageList.length);
            this.top=0;
            return this.Pop();
        }
    }

    // 队列长度
    Length(){
        return (this.messageList.length-this.top);
    }

    // 设置
    Set(index, message){
        this.messageList[index] = message;
    }

    // 获取
    Get(index){
        return this.messageList[index];
    }

    IsHaveMessage(){
        if (this.top < this.messageList.length){
            return true;
        }
        return false;
    }

    GetAll(){
        var data = [];
        for(var i = this.top; i < this.messageList.length; i++){
            data.push(this.messageList[i]);
        }
        return data;
    }

    toString(){
        return `messageQueue:{top:${this.top},Length:${this.Length()}}`
    }
}

module.exports = MessageQueue;