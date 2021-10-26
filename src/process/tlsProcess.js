'use strict'
/**
 * @Author: cups
 * @Description:
 * @File:  tlsProcess
 * @Version: 1.0.0
 * @Date: 2020/10/26 8:29
 **/
const Constant = require('../constant');
const Message = require("../queue/message");
const MessageQueue = require("../queue/messageQueue");
const tls = require("tls");
const io = require("socket.io-client");

/**回应消息队列**/
var resMessageQueue= new MessageQueue();

/**进程间通信**/
const socket = io("http://localhost:"+Constant.PROCESS_COMMUNICATION_PORT);

/**TLS服务器配置**/
const options = {
    key: Constant.TLS_KEY,
    cert: Constant.TLS_CERT,
    ca: [Constant.TLS_CA],
    requestCert: true,
    rejectUnauthorized: true
};

/**
 *  启动TLS服务器
 * **/
var Socket;
var isCanWrite = false;
const server = tls.createServer(options, function(tlsSocket) {
    logMessage("server connected", tlsSocket.authorized ? "authorized" : "unauthorized");
    tlsSocket.setEncoding("utf8");
    /**
     *  TLSSocket备份
     * **/
    Socket = tlsSocket;
    isCanWrite = true;

    /**
     *  检查是否有上次通信时未发出的消息
     * **/
    while(resMessageQueue.IsHaveMessage()){
        tlsSocket.write(resMessageQueue.Pop());
    }

    /**
     *  TLS服务器收到消息
     * **/
    var messageArray;
    var message;
    var index;
    tlsSocket.on("data", function(data) {
        try{
            message = JSON.parse(data);
            socket.emit(Constant.MANAGE_REQ_MESSAGE, message);
            // logMessage("data", message.messageId);
        }catch (error) {
            logMessage(error);
        }
    });

    /**
     *  客户端发生错误
     * **/
    tlsSocket.on("error", function() {
        logMessage("error");
    });

    /**
     *  客户端关闭
     * **/
    tlsSocket.on("close", function() {
        logMessage("close");
    });

    // tlsSocket.pipe(tlsSocket);
});

/**监听配置好的端口**/
server.listen(Constant.TLS_PORT, function() {
    socket.emit(Constant.MANAGE_TLS_INIT, {pid:process.pid,message:`tlsProcess: PID ${process.pid}>>>>>初始化成功`});
    logMessage("启动TLS通信服务器已启动地址:", server.address());
});

/**
 *  进程间通信事件
 * **/
// 回应消息
socket.on(Constant.TLS_RES_MESSAGE, message => {
    if (isCanWrite){
        Socket.write(JSON.stringify(message));
        // logMessage("res", JSON.stringify(message));
    }else {
        resMessageQueue.Push(message);
    }
});

// 获取回应消息队列
socket.on(Constant.TLS_GET_RES_MESSAGE_QUEUE, message => {
    socket.emit(Constant.MANAGE_GET_RES_MESSAGE_QUEUE, resMessageQueue.Length());
});

// 获取进程内存占用状态
socket.on(Constant.TLS_GET_PROCESS_STATE, message => {
    socket.emit(Constant.PROCESS_STATE, {processName:"tlsProcess",memoryUsage:process.memoryUsage()});
});

/**
 *  消息处理函数
 * **/
function logMessage(...message) {
    console.log(Constant.LOG_TLS, `tlsProcess: PID ${process.pid} time ${process.hrtime()} >>>>>`, ...message);
}