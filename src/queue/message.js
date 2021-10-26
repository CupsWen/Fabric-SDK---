'use strict'
/**
 * @Author: cups
 * @Description: 消息
 * @File:  message
 * @Version: 1.0.0
 * @Date: 2020/10/23 15:16
 **/

class message {
    // 构造函数
    constructor(messageId, messageCode, messageData) {
        /**
         *  消息ID
         * **/
        this.messageId = messageId;
        /**
         *  业务类型码
         *  0   初始状态
         *  1   注册证书
         *  2   登记证书
         *  3   查询交易
         *  4   交易
         * **/
        this.messageCode = messageCode;
        /**
         *  数据
         *
         * **/
        this.messageData = messageData;
    }

    setMessageId(messageId){
        this.messageId = messageId;
    }

    getMessageId(){
        return this.messageId;
    }

    setMessageCode(messageCode){
        this.messageCode = messageCode;
    }

    getMessageCode(){
        return this.messageCode;
    }

    setMessageData(messageData){
        this.messageData = messageData;
    }

    getMessageData(){
        return this.messageData;
    }

    toString(){
        return `message:{messageId:${this.messageId},code:${this.messageCode},messageData:${this.messageData}}`
    }
}

module.exports= message;