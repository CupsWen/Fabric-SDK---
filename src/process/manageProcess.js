'use strict'
/**
 * @Author: cups
 * @Description:
 * @File:  messageProcess
 * @Version: 1.0.0
 * @Date: 2020/10/26 8:29
 **/

const Constant = require('../constant');
const Message = require("../queue/message");
const MessageQueue = require("../queue/messageQueue");
const ChildProcess = require('child_process');
const io = require("socket.io")(Constant.PROCESS_COMMUNICATION_PORT);

logMessage("启动messageProcess进程");

/**消息队列**/
var reqMessageQueue = new MessageQueue();

/**各进程socket列表**/
var socketList = {};

/**各进程PID表**/
var processPidList = {};

/**工作进程工作状态表**/
var workerProcessPAUSE = [];
var workerProcessRUN = [];
Array.prototype.remove = function(val) {
    let index = this.indexOf(val);
    if (index > -1) {
        this.splice(index, 1);
    }
};

/**
 *  启动各进程
 * **/

processPidList["manageProcess"] = process.pid;

// 启动TLS通信进程
const tlsProcess = ChildProcess.fork("./src/process/tlsProcess.js");
processPidList["tlsProcess"] = tlsProcess.pid;

// 启动工作进程
var workerProcess;
for (let i=0;i<Constant.WORKER_PROCESS_NUMBER;i++){
    workerProcess = ChildProcess.fork("./src/process/workerProcess.js");
    processPidList["workerProcess"+i] = workerProcess.pid;
}
const monitorProcess = ChildProcess.fork("./src/process/monitorProcess.js");
processPidList["monitorProcess"] = monitorProcess.pid;

/**
 *  进程通信服务器
 * **/
var workerProcessSocket;            // 工作进程Socket，中间量
io.on("connection", socket => {
    // logMessage(socket.request.connection.remoteAddress);
    // logMessage("debug",socket.id);
    // TLS通信进程初始化成功消息
    socket.on(Constant.MANAGE_TLS_INIT, message => {
        socketList["tlsProcess"] = socket;
    });

    // 工作进程初始化成功消息
    socket.on(Constant.MANAGE_WORKER_INIT, message => {
        socketList["workerProcess"+message.pid] = socket;
        workerProcessPAUSE.push(socket);
    });

    // 监控进程初始化成功消息
    socket.on(Constant.MANAGE_MONITOR_INIT, message => {
        socketList["monitorProcess"] = socket;
        socket.emit(Constant.MONITOR_PROCESS_PID_LIST, processPidList);
        // socket.emit(Constant.MONITOR_PROCESS_SOCKET_LIST, socketList);
    });

    // 请求消息
    socket.on(Constant.MANAGE_REQ_MESSAGE, message => {
        // logMessage("req", message.messageId, workerProcessPAUSE.length);
        reqMessageQueue.Push(message);
        if (workerProcessPAUSE.length>0){
            workerProcessSocket = workerProcessPAUSE.pop();
            workerProcessSocket.emit(Constant.WORKER_WORK_MESSAGE, reqMessageQueue.Pop());
            workerProcessPAUSE.remove(workerProcessSocket);
            workerProcessRUN.push(workerProcessSocket);
        }
    });

    // 工作进程处理完消息
    socket.on(Constant.MANAGE_WORKER_STOP, message => {
        socketList["tlsProcess"].emit(Constant.TLS_RES_MESSAGE,message);
        if (reqMessageQueue.IsHaveMessage()){
            socket.emit(Constant.WORKER_WORK_MESSAGE, reqMessageQueue.Pop());
        }else{
            workerProcessRUN.remove(socket);
            workerProcessPAUSE.push(socket);
        }
    });

    // 请求消息队列
    socket.on(Constant.MANAGE_GET_REQ_MESSAGE_QUEUE, message => {
        socket.emit(Constant.MONITOR_REQ_MESSAGE_QUEUE, reqMessageQueue.Length());
        socketList["tlsProcess"].emit(Constant.MANAGE_GET_REQ_MESSAGE_QUEUE, "获取回应消息队列!");
    });

    // 回应消息队列
    socket.on(Constant.MANAGE_GET_REQ_MESSAGE_QUEUE, message => {
        socketList["monitorProcess"].emit(Constant.MONITOR_RES_MESSAGE_QUEUE, message);
    });

    // 消息管理进程内存占用状态
    socket.on(Constant.MANAGE_PROCESS_STATE, message => {
        socket.emit(Constant.MONITOR_PROCESS_STATE, message);
    });

    // 进程内存占用状态(中转)
    socket.on(Constant.PROCESS_STATE, message => {
        socket.emit(Constant.MONITOR_PROCESS_STATE, message);
    });
});

/**
 *  消息处理函数
 * **/
function logMessage(...message) {
    console.log(Constant.LOG_MANAGE, `messageProcess: PID ${process.pid} time ${process.hrtime()}>>>>>`, ...message);
}

/**
 * *    延迟函数
 * @param  {number}     time    延迟时间
 * @return {type}               null
 */
async function sleep(time = 10) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve();
        }, time);
    })
}
