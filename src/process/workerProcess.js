'use strict'
/**
 * @Author: cups
 * @Description:
 * @File:  workProcess
 * @Version: 1.0.0
 * @Date: 2020/10/26 8:30
 **/
const Constant = require("../constant");
const Message = require("../queue/message");
const FabricSDK = require("../fabricSdk");
const io = require('socket.io-client');
const path = require("path");
const fs = require("fs");

/**进程间通信**/
const socket = io("http://localhost:"+Constant.PROCESS_COMMUNICATION_PORT);

const SDK = new FabricSDK();
SDK.loadGateWays(Constant.WALLET_PATH, Constant.CCP);
/**
 *  进程间通信事件
 * **/
// 工作消息
socket.on(Constant.WORKER_WORK_MESSAGE, async message => {
    /**接收到消息**/
    // logMessage(message.messageId);
    // logMessage("debug", `workProcess PID ${process.pid}:>>>>>`,"messageId", message.messageId, "messageCode", message.messageCode, "messageData", message.messageData);
    let messageData = message.messageData;
    /**执行消息**/
    let result = "";
    switch (message.messageCode){
        case Constant.QUERY_CERTIFICATE:
            result = await SDK.queryCertificate(messageData.walletName, messageData.userLabel);
            break;
        case Constant.ENROLL_CERTIFICATE:
            result = await SDK.enrollCertificate(messageData.walletName, messageData.userLabel, messageData.connectionFileName, messageData.caUrl, messageData.userSecret, messageData.mspId);
            break;
        case Constant.REGISTER_CERTIFICATE:
            result = await SDK.registerCertificate(messageData.walletName, messageData.adminLabel, messageData.connectionFileName, messageData.caUrl, messageData.userLabel, messageData.role, messageData.affiliation, messageData.mspId, messageData.attribute);
            break;
        case Constant.QUERY_BLOCK_BY_BLOCK_ID:
            result = await SDK.queryBlockByBlockID(messageData.walletName, messageData.userLabel, messageData.connectionFileName, messageData.channelName, Number(messageData.number));
            break;
        case Constant.QUERY_BLOCK_BY_TXID:
            result = await SDK.queryBlockByTxID(messageData.walletName, messageData.userLabel, messageData.connectionFileName, messageData.channelName, messageData.txid);
            break;
        case Constant.QUERY_DATA:
            result = await SDK.queryData(messageData.walletName, messageData.userLabel, messageData.connectionFileName, messageData.channelName, messageData.contractName, messageData.contractFunctionName, messageData.args);
            break;
        case Constant.QUERY_HISTORY_DATA:
            result = await SDK.queryData(messageData.walletName, messageData.userLabel, messageData.connectionFileName, messageData.channelName, messageData.contractName, messageData.contractFunctionName, messageData.args);
            break;
        case Constant.TRANSACTION:
            result = await SDK.transaction(messageData.walletName, messageData.userLabel, messageData.connectionFileName, messageData.channelName, messageData.contractName, messageData.chaincodeVersion, messageData.chaincodeType, messageData.contractFunctionName, messageData.args);
            break;
        default:
            break;
    }

    /**
     *  返回消息处理结果
     * **/
    let msg = new Message(message.messageId, message.messageCode, result);
    socket.emit(Constant.MANAGE_WORKER_STOP, msg);
    messageData = undefined;
    result = undefined;
    message = undefined;
});

// 获取进程工作状态消息
socket.on(Constant.WORKER_PROCESS_STATE, message => {
    socket.emit(Constant.PROCESS_STATE, {processName:"workProcess-"+process.pid, memoryUsage:process.memoryUsage()});
});

/**工作进程初始化完毕**/
// console.log(`workProcess: workProcess PID ${process.pid} 初始化完毕`, Date.now());
socket.emit(Constant.MANAGE_WORKER_INIT, {pid:process.pid});
logMessage("初始化完毕");

/**
 *  消息处理函数
 * **/
function logMessage(...message) {
    console.log(Constant.LOG_WORKER, `workerProcess: PID ${process.pid} time ${process.hrtime()}>>>>>`, ...message);
}