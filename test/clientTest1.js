/**
 * @Author: cups
 * @Description:
 * @File:  Client
 * @Version: 1.0.0
 * @Date: 2020/10/26 9:45
 **/

const tls = require('tls');
const fs = require('fs');
const Constant = require('../src/constant');
const Message = require('../src/queue/message');
const Moment = require("moment");

/**
 *  客户端配置文件
 * **/
const options = {
    // host: "192.168.30.9",
    host: "192.168.1.205",
    port: Constant.TLS_PORT,
    key: fs.readFileSync("../static/ssl-certs/client-key.pem"),
    cert: fs.readFileSync("../static/ssl-certs/client-cert.pem"),
    ca: [ fs.readFileSync("../static/ssl-certs/ca.pem") ],
    rejectUnauthorized: true
};

/**
 *  连接TLS服务器
 * **/
const client = tls.connect(options, function() {
    logMessage('client connected', client.authorized ? 'authorized' : 'unauthorized');
});
client.setEncoding('utf8');

/**
 *  收到数据
 * **/
var start;
var end;
var sndMessageNumber = 0;
var receivedMessageNumber = 0;
client.on("data", function(data) {
    try{
        // const message = JSON.parse(data.trim());
        logMessage(data);
        receivedMessageNumber += 1;
        if (receivedMessageNumber == sndMessageNumber){
            end = process.hrtime();
            logMessage("time:", "("+end[0]+"."+end[1]+"-"+start[0]+"."+start[1]+")");
            logMessage("avg time:", "("+end[0]+"."+end[1]+"-"+start[0]+"."+start[1]+")/"+sndMessageNumber);
            client.destroy();
        }
    }catch (error) {
        logMessage(error);
        client.destroy();
    }
});

//  查询操作1000===========20
//  每秒50笔
//  进程间通信5ms，每秒200次。
//  进程间通信(TLS->message->worker->message->TLS)5*4=20ms。
//  200/4=50。

// 12-3=9
// 进程数9  查询  (1.4234465599947725+1.92143609199411+0.5977603159990394+1.1741021220004768+1.1759797790000448)/5 = 1.2585449737976888s     TPS 794
// 进程数9  交易  (3.13701317399682+2.2963352799997665+2.3488917229988147+2.2963635099949897+1.558689236000646)/5 = 2.327458584598207s       TPS 429
// 网络的TPS   1120
sndMessageNumber = 1000;

// client.write(JSON.stringify({messageId:"0000", messageCode:Constant.QUERY_CERTIFICATE, messageData:{walletName:"Court",userLabel:"cups"}}));
// client.write(JSON.stringify({messageId:"0001", messageCode:Constant.ENROLL_CERTIFICATE, messageData:{walletName:"Court",userLabel:"admin", connectionFileName:"connection-court.json", caUrl:"ca.court.com", userSecret:"adminpw", mspId:"CourtMSP"}}));
// client.write(JSON.stringify({messageId:"0002", messageCode:Constant.REGISTER_CERTIFICATE, messageData:{walletName:"Court",adminLabel:"admin", connectionFileName:"connection-court.json", caUrl:"ca.court.com",userLabel:"cups", role:"client", affiliation:"org1.department1", mspId:"CourtMSP", attribute:{"name":"cups"}}}));
// client.write(JSON.stringify({messageId:"0003", messageCode:Constant.QUERY_BLOCK_BY_BLOCK_ID, messageData:{walletName:"Court",userLabel:"cups", connectionFileName:"connection-court.json", channelName:"mychannel", number:1}}));
// client.write(JSON.stringify({messageId:"0004", messageCode:Constant.QUERY_BLOCK_BY_TXID, messageData:{walletName:"Court",userLabel:"cups", connectionFileName:"connection-court.json", channelName:"mychannel", txid:"1b8263a228ce5aea59022f4100bdf7a53abf62f159d6bd515a18b7956e6fa048"}}));
// client.write(JSON.stringify({messageId:"0005", messageCode:Constant.QUERY_DATA, messageData:{walletName:"Court",userLabel:"cups", connectionFileName:"connection-court.json", channelName:"mychannel",contractName:"zhh",contractFunctionName:"query", args:"1000"}}));
// client.write(JSON.stringify({messageId:"0006", messageCode:Constant.QUERY_HISTORY_DATA, messageData:{walletName:"Court",userLabel:"cups", connectionFileName:"connection-court.json", channelName:"mychannel",contractName:"zhh",contractFunctionName:"queryHistory", args:"1000"}}));
// client.write(JSON.stringify({messageId:"0007", messageCode:Constant.TRANSACTION, messageData:{walletName:"Court",userLabel:"cups", connectionFileName:"connection-court.json", channelName:"mychannel",contractName:"zhh",chaincodeVersion:"1",chaincodeType:"golang", contractFunctionName:"InitMember", args:["5","1000"]}}));

var message;
for (var i=0 ;i<sndMessageNumber;i++) {
    message = JSON.stringify({
        messageId: i,
        messageCode: Constant.QUERY_DATA,
        messageData: {
            walletName: "Court",
            userLabel: "cups",
            connectionFileName: "balance",
            channelName: "mychannel",
            contractName: "zhh",
            contractFunctionName: "query",
            args: "1000"
        }
    });

    // 210
    // console.log(message.length);
    // connection-court.json

    // message = JSON.stringify({messageId:"0007", messageCode:Constant.TRANSACTION, messageData:{walletName:"Court",userLabel:"cups", connectionFileName:"connection-court.json", channelName:"mychannel",contractName:"zhh",chaincodeVersion:"1",chaincodeType:"golang", contractFunctionName:"InitMember", args:["5","1000"]}});
    client.write(message);
}

start =process.hrtime();

function logMessage(...message) {
    console.log(Constant.LOG_CLIENT, `Client: PID ${process.pid}>>>>>`, ...message);
}


function writeTime(filePath){
    fs.appendFileSync(filePath, Moment(Date.now()).format("HH:mm:ss")+"\n", function (error) {});
}

async function wait(time) {
    await sleep(time);
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