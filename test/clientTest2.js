/**
 * @Author: cups
 * @Description:
 * @File:  test
 * @Version: 1.0.0
 * @Date: 2020/10/28 9:02
 **/

const { FileSystemWallet, Gateway } = require('fabric-network');
const path = require('path');
const fs = require('fs');
const Moment = require("moment");

const profiler = require("v8-profiler-node8");
const Bluebird = require("bluebird");



var start;
var end;
var sndMessageNumber = 1000;

main();

async function main() {
    // cpuProf();
    await queryData("Court", "cups", "Court/connection-court.json", "mychannel", "zhh", "query", "1000");
}
function writeTime(filePath){
    fs.appendFileSync(filePath, Moment(Date.now()).format("HH:mm:ss")+"\n", function (error) {});
}

/**
 * *    查询数据
 * @param  {String}    walletName               证书存放文件名
 * @param  {String}    userLabel                用户证书Label
 * @param  {String}    connectionFileName       连接文件名称
 * @param  {String}    channelName              通道名称
 * @param  {String}    contractName             智能合约名称
 * @param  {String}    contractFunctionName     智能合约函数名称
 * @param  {...String} args                     参数列表
 * @return {JSON}                               {processState:处理状态, message:消息}
 */
async function queryData(walletName, userLabel, connectionFileName, channelName, contractName, contractFunctionName, ...args){
    try {

        // 连接文件路径
        const ccpPath = path.resolve(__dirname, '..', "static/connection_file", connectionFileName);
        // 初始化文件系统
        const walletPath = path.resolve(__dirname, "..", "static/wallet", walletName);
        const wallet = new FileSystemWallet(walletPath);
        // 判断证书是否存在
        const userExists = await wallet.exists(userLabel);
        if (!userExists) {
            return {processState:0, message: `queryData>>>>>${userLabel}用户证书不存在`};
        }
        // 创建Gateway对象
        const gateway = new Gateway();
        await gateway.connect(ccpPath, { wallet: wallet, identity: userLabel, discovery: { enabled: true, asLocalhost: false} });
        const network = await gateway.getNetwork(channelName);
        const contract = network.getContract(contractName);
        start =process.hrtime();
        // 查询
        var number = 0;
        for (var i=0;i<sndMessageNumber;i++){
            const rawData = await contract.evaluateTransaction("query", "1000");
            const result = JSON.parse(byteToString(rawData));
        }
        // 断开连接
        await gateway.disconnect();
        end = process.hrtime();
        console.log("time:", "("+end[0]+"."+end[1]+"-"+start[0]+"."+start[1]+")");
        console.log("avg time:", "("+end[0]+"."+end[1]+"-"+start[0]+"."+start[1]+")/"+sndMessageNumber);
        return {processState:1, message:result};
    } catch (error) {
        return {processState:0, message: `queryData>>>>> error: ${error}`};
    }
}

/**
 * *
 * @param  {String} walletName              证书存放文件名
 * @param  {String} userLabel               用户证书Label
 * @param  {String} connectionFileName      连接文件名称
 * @param  {String} channelName             通道名称
 * @param  {String} contractName            智能合约名称
 * @param  {String} chaincodeVersion        智能合约版本
 * @param  {String} chaincodeType           智能合约类型
 * @param  {String} contractFunctionName    智能合约函数名称
 * @param  {String} args                    参数列表
 * @return {JSON}                           {processState:处理状态, message:消息}
 */
async function transaction(walletName, userLabel, connectionFileName, channelName, contractName, chaincodeVersion, chaincodeType, contractFunctionName, args){
    try {
        // 连接文件路径
        const ccpPath = path.resolve(__dirname, '..', "static/connection_file", connectionFileName);
        const ccpJSON = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
        // 初始化文件系统
        const walletPath = path.resolve(__dirname, "..", "static/wallet", walletName);
        const wallet = new FileSystemWallet(walletPath);

        // 判断证书是否存在
        const userExists = await wallet.exists(userLabel);
        if (!userExists) {
            return {processState:0, message: `transaction>>>>>${userLabel}用户证书不存在`};
        }

        // 创建Gateway对象
        const gateway = new Gateway();
        await gateway.connect(ccpPath, { wallet: wallet, identity: userLabel, discovery: { enabled: true, asLocalhost: false} });
        const network = await gateway.getNetwork(channelName);
        const channel = await network.getChannel();

        // 查询
        const fabric_client = await gateway.getClient();
        channel.removePeer(channel.getPeers()[0]);
        for (var key in ccpJSON.peers) {
            const peerUrl = ccpJSON.peers[key].url;
            const peerPem = ccpJSON.peers[key].tlsCACerts.pem;
            channel.addPeer(fabric_client.newPeer(peerUrl, {pem:peerPem}));
        }

        const transactionID = fabric_client.newTransactionID(true);
        const proposalObj = {
            targets: channel.getChannelPeers(),
            chaincodeId: contractName,
            chaincodeVersion: chaincodeVersion,
            chaincodeType: chaincodeType,
            txId: transactionID,
            fcn: contractFunctionName,
            args: args
        };
        const proposalRes = await channel.sendTransactionProposal(proposalObj);
        var rawData = await channel.sendTransaction({
            proposalResponses: proposalRes[0],
            proposal: proposalRes[1]
        });

        if (rawData["status"] == 'SUCCESS'){
            return {state:1, message:{transaction_id:transactionID["_transaction_id"]}};
        }
        await gateway.disconnect();
        return {processState:0, message:rawData};
    } catch (error) {
        return {processState:0, message: `transaction>>>>> error: ${error}`};
    }
}

function byteToString(arr)
{
    if(typeof arr === 'string') {
        return arr;
    }
    var str = '',
        _arr = arr;
    for(var i = 0; i < _arr.length; i++) {
        var one = _arr[i].toString(2),
            v = one.match(/^1+?(?=0)/);
        if(v && one.length == 8) {
            var bytesLength = v[0].length;
            var store = _arr[i].toString(2).slice(7 - bytesLength);
            for(var st = 1; st < bytesLength; st++) {
                store += _arr[st + i].toString(2).slice(2);
            }
            str += String.fromCharCode(parseInt(store, 2));
            i += bytesLength - 1;
        } else {
            str += String.fromCharCode(_arr[i]);
        }
    }
    return str;
}

async function cpuProf() {
    console.log('开始收集');
    // Start Profiling
    profiler.startProfiling("CPU profile");
    await Bluebird.delay(1000 * 30);
    const profile = profiler.stopProfiling();
    profile.export(function(error, result) {
        fs.writeFileSync(`clientTest2-${process.pid}.json`, result);
        profile.delete();
    });
}