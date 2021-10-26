/**
 * @Author: cups
 * @Description:
 * @File:  monitorProcess.js
 * @Version: 1.0.0
 * @Date: 2020/11/3 17:36
 **/

const Constant = require("../constant");
const MessageQueue = require("../queue/messageQueue");
const io = require("socket.io-client");

/**进程间通信**/
const socket = io("http://localhost:"+Constant.PROCESS_COMMUNICATION_PORT);

/**请求消息队列**/
var reqMessageQueue = {};

/**回应消息队列**/
var resMessageQueue = {};

/**各进程socket列表**/
var socketList = {};

/**进程工作状态表**/
var processState = {};

/**各进程PID表**/
var processPidList = {};

/**
 *  进程间通信事件
 * **/
// 异常消息
socket.on(Constant.MONITOR_ERROR_MESSAGE, async message => {
    logMessage(message);
});

// 请求消息队列
socket.on(Constant.MONITOR_REQ_MESSAGE_QUEUE, async message => {
    // logMessage(Constant.MONITOR_REQ_MESSAGE_QUEUE, message);
    reqMessageQueue = message;
});

// 回应消息队列
socket.on(Constant.MONITOR_RES_MESSAGE_QUEUE, async message => {
    // logMessage(Constant.MONITOR_RES_MESSAGE_QUEUE, message);
    resMessageQueue = message;
});

// 各进程通信Socket列表
socket.on(Constant.MONITOR_PROCESS_SOCKET_LIST, async message => {
    // logMessage(Constant.MONITOR_PROCESS_SOCKET_LIST, message);
    socketList = message;
});

// 进程状态
socket.on(Constant.MONITOR_PROCESS_STATE, async message => {
    processState[message.processName] = message.memoryUsage
});

// 各进程PID列表
socket.on(Constant.MONITOR_PROCESS_PID_LIST, async message => {
    processPidList = message;
    // logMessage(Constant.MONITOR_PROCESS_PID_LIST, message);
});

/**
 *  web服务器需要的函数包
 * **/
const Koa = require("koa");
const Router = require("koa-router");
const OS = require('os');
const fs = require("fs");
const Nodemailer = require("nodemailer");
const PidUsage = require("pidusage");
const QueryString = require("querystring");

const app = new Koa();
const cors = require("koa-cors");
app.use(cors());
const router = new Router();
/**主界面**/
router.get("/", async ctx=>{
    ctx.response.type = "html";
    ctx.response.body = fs.readFileSync("./static/views/home.html");
});

// rss: 130772992       // 总内存占用。
// heapTotal: 121925632 // 堆占用的内存，包括用到的和没用到的。
// heapUsed: 106210400  // 用到的堆的部分。
// external: 2984477    // V8 引擎内部的 C++ 对象占用的内存。
/**/
/**系统资源状态**/
router.get("/osResourceState", async ctx => {
    ctx.response.body = {"cpus":OS.cpus(), "arch":OS.arch(), "platform":OS.platform(), "type":OS.type(), "uptime":OS.uptime(),"totalmem":OS.totalmem(), "freemem":OS.freemem()};
});

/**进程状态**/
router.get("/processState", async ctx => {
    let reqProcessName = QueryString.parse(ctx.url,"?","=")["processName"];
    if (reqProcessName == undefined){
        let processStateList = {};
        for (let processName in processPidList){
            processStateList[processName] = await PidUsage(processPidList[processName]);
        }
        ctx.response.body = processStateList;
    }else{
        // console.log(reqProcessName);
        switch (reqProcessName) {
            case "allProcessState":
                let processStateList = {};
                for (let processName in processPidList){
                    try{
                        processStateList[processName] = await PidUsage(processPidList[processName]);
                    }catch (e) {
                        processStateList[processName] = {cpu: 0, memory: 0, ppid: 0, pid: 0, ctime: 0, elapsed: 0, timestamp: 0};
                    }
                }
                ctx.response.body = processStateList;
                break
            case "messageQueueState":
                socket.emit(Constant.MANAGE_GET_REQ_MESSAGE_QUEUE, 0);
                ctx.response.body = {reqMessageQueue:reqMessageQueue, resMessageQueue:resMessageQueue};
                break
            case "manageProcessState":
                ctx.response.body = await PidUsage(processPidList["manageProcess"]);
                break
            case "tlsProcessState":
                ctx.response.body = await PidUsage(processPidList["tlsProcess"]);
                break
            case "workerProcessState":
                let workerProcessStateList = {};
                for (let processName in processPidList){
                    if (processName.startsWith("workerProcess")){
                        workerProcessStateList[processName] = await PidUsage(processPidList[processName]);
                    }
                }
                ctx.response.body = workerProcessStateList;
                break
            case "monitorProcessState":
                ctx.response.body = await PidUsage(processPidList["monitorProcess"]);
                break
            default:
                ctx.response.body = "参数错误!";
                break
        }

    }
});

/**html**/
router.get("/html", async ctx => {
    let reqHtmlName = QueryString.parse(ctx.url,"?","=")["html"];
    ctx.response.type = "html";
    ctx.response.body = fs.readFileSync("./static/views/html/"+reqHtmlName+".html");
});

/**png**/
router.get("/pic", async ctx => {
    let reqImageName = QueryString.parse(ctx.url,"?","=")["image"];
    ctx.response.type = "image/png";
    ctx.response.body = fs.readFileSync("./static/views/pic/"+reqImageName);
});

app.use(router.routes());
app.listen(Constant.WEB_PORT);

/**检查进程状态**/
checkProcessStatus();

/**监控进程初始化完毕**/
socket.emit(Constant.MANAGE_MONITOR_INIT, `monitorProcess: monitorProcess PID ${process.pid} 初始化完毕`);
logMessage("初始化完毕");

async function checkProcessStatus() {
    while (true){
        await sleep(Constant.POLLING_TIME);
        isProcessHaveError();
    }
}

/**
 *  是否有错误发生
 * **/
async function isProcessHaveError() {

    if (OS.freemem()/1024/104<Constant.LIMIT_MEM){
        let html = "<p>Fabric SDK中间件错误</p>";
        html += "<p>发生错误的Fabric SDK中间件名称："+Constant.NAME+"</p>";
        html += "<p>发生错误的名称：系统内存少于下线"+Constant.LIMIT_MEM+"M</p>";
        sendEMail(Constant.EMAIL_ADDRESS, "Fabric SDK中间件错误",html);
    }

    for (let processName in processPidList){
        try{
            await sleep(100);
            await PidUsage(processPidList[processName]);
        }catch (e) {
            logMessage("ERROR: ", e.toString());
            let html = "<p>Fabric SDK中间件错误</p>";
            html += "<p>发生错误的Fabric SDK中间件名称："+Constant.NAME+"</p>";
            html += "<p>发生错误的名称：进程"+processName+"退出</p>";
            sendEMail(Constant.EMAIL_ADDRESS, "Fabric SDK中间件错误",html);
        }
    }
}

async function sendEMail(email, subject, html) {
    let transporter = Nodemailer.createTransport({
        service: 'qq',
        port: 465,
        secureConnection: true,
        auth: {
            user: '1191567189@qq.com',
            pass: 'ymhtyusyknzxiefe',
        }
    });

    let mailOptions = {
        from: '"智慧生活" <1191567189@qq.com>',
        // 843080741@qq.com
        to: email,
        subject: subject,
        html: html
    };

    let singnal = 1;
    let err = "";
    let data = "";
    await transporter.sendMail(mailOptions, (error, info) => {
        err = error;
        data = info;
        singnal = 0;
    });
    await wait();

    if (err){
        return "Error "+err;
    }else {
        return data;
    }

    /**
     * 等待函数
     * **/
    // todo : cups 等待函数
    async function wait() {
        while (true){
            await sleep();
            if (singnal==0){break}
        }
    }

    /**
     * *    延迟函数
     * @param  {number}     time    延迟时间
     * @return {type}               null
     */
    // todo : cups 延迟函数
    async function sleep(time = 10) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve();
            }, time);
        })
    }
}

/**
 *  消息处理函数
 * **/
function logMessage(...message) {
    console.log(Constant.LOG_MONITOR, `monitorProcess: PID ${process.pid} time ${process.hrtime()} >>>>>`, ...message);
}

/**
 * *    延迟函数
 * @param  {number}     time    延迟时间
 * @return {type}               null
 */
async function sleep(time = 100) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve();
        }, time);
    })
}