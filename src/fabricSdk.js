/**
 * @Author: cups
 * @Description: Fabric相关操作函数
 * @File:  fabricSdk
 * @Version: 1.0.0
 * @Date: 2020/11/6 10:18
 **/
const { FileSystemWallet, Gateway, X509WalletMixin } = require("fabric-network");
const FabricCAServices = require("fabric-ca-client");
const path = require("path");
const fs = require("fs");

class FabricSdk {

    constructor() {
        this.GateWays = [];
        this.Networks = [];
        this.Contracts = [];
        this.Channels = [];
        this.CONNETIONFILES = [];
    }

    async loadGateWays(walletPath, connectionFilePath){
        this.walletPath = path.resolve(__dirname, "..", walletPath);
        this.connectionFilePath = path.resolve(__dirname, "..", connectionFilePath);
        // 证书存储目录
        let walletNames = fs.readdirSync(this.walletPath).filter(file => fs.lstatSync(path.join(this.walletPath, file)).isDirectory());
        // 遍历证书
        for (let walletName of walletNames){
            let wallet = new FileSystemWallet(path.join(this.walletPath, walletName));

            let walletNamePath = path.join(this.walletPath, walletName);
            let userLabels = fs.readdirSync(walletNamePath).filter(file => fs.lstatSync(path.join(walletNamePath, file)).isDirectory());
            // 连接文件
            let connectionFilePathName = path.join(this.connectionFilePath, walletName);
            let connectionFiles = fs.readdirSync(connectionFilePathName).filter(file => fs.lstatSync(path.join(connectionFilePathName, file)));
            this.CONNETIONFILES[walletName] = connectionFiles;
            for(let userLabel of userLabels){
                for(let connectionFileName of connectionFiles){
                    let ccpPath = path.resolve(__dirname, "..", this.connectionFilePath, walletName, connectionFileName);
                    let gateway = new Gateway();
                    await gateway.connect(ccpPath, { wallet: wallet, identity: userLabel, discovery: { enabled: true, asLocalhost: false} });
                    this.GateWays[walletName+"*"+userLabel+"*"+connectionFileName] = gateway;
                    // console.log(gateway.getOptions());
                }
            }
        }
        // console.log(this.GateWays);
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
    async queryData(walletName, userLabel, connectionFileName, channelName, contractName, contractFunctionName, ...args){
        try {
            if (connectionFileName=="balance"){
                if(!(walletName in this.CONNETIONFILES)){
                    this.CONNETIONFILES = fs.readdirSync(path.join(this.connectionFilePath,walletName)).filter(file => fs.lstatSync(path.join(this.connectionFilePath, walletName, file)));
                }
                connectionFileName = this.CONNETIONFILES[walletName][this.randomNum(0,this.CONNETIONFILES[walletName].length-1)];
            }

            let gName = walletName + "*" + userLabel + "*" + connectionFileName;
            let nName = gName + "*" + channelName;
            let ccName = nName + "*" + contractName;

            if (!(gName in this.GateWays)){
                let wallet = new FileSystemWallet(path.join(this.walletPath, walletName));
                let ccpPath = path.resolve(__dirname, "..", this.connectionFilePath, walletName, connectionFileName);

                let gateway = new Gateway();
                await gateway.connect(ccpPath, { wallet: wallet, identity: userLabel, discovery: { enabled: true, asLocalhost: false} });
                this.GateWays[gName] = gateway;
            }

            if (!(nName in this.Networks)){
                this.Networks[nName] = await this.GateWays[gName].getNetwork(channelName);
            }

            if (!(ccName in this.Contracts)){
                this.Contracts[ccName] = await this.Networks[nName].getContract(contractName);
            }

            let rawData = await this.Contracts[ccName].evaluateTransaction(contractFunctionName, ...args);
            let result = JSON.parse(this.byteToString(rawData));
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
    async transaction(walletName, userLabel, connectionFileName, channelName, contractName, chaincodeVersion, chaincodeType, contractFunctionName, args){
        try {
            if (connectionFileName=="balance"){
                if(!(walletName in this.CONNETIONFILES)){
                    this.CONNETIONFILES = fs.readdirSync(path.join(this.connectionFilePath,walletName)).filter(file => fs.lstatSync(path.join(this.connectionFilePath, walletName, file)));
                }
                connectionFileName = this.CONNETIONFILES[walletName][this.randomNum(0,this.CONNETIONFILES[walletName].length-1)];
            }

            let gName = walletName + "*" + userLabel + "*" + connectionFileName;
            let nName = gName + "*" + channelName;
            let cName = nName;

            if (!(gName in this.GateWays)){
                let wallet = new FileSystemWallet(path.join(this.walletPath, walletName));
                let ccpPath = path.resolve(__dirname, "..", this.connectionFilePath, walletName, connectionFileName);

                let gateway = new Gateway();
                await gateway.connect(ccpPath, { wallet: wallet, identity: userLabel, discovery: { enabled: true, asLocalhost: false} });
                this.GateWays[gName] = gateway;
            }

            if (!(nName in this.Networks)){
                this.Networks[nName] = await this.GateWays[gName].getNetwork(channelName);
            }

            if (!(cName in this.Channels)){
                let ccpPath = path.resolve(__dirname, "..", this.connectionFilePath, walletName, connectionFileName);
                let ccpJSON = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
                let fabric_client = await this.GateWays[gName].getClient();

                let channel = this.Networks[nName].getChannel();
                let peers = channel.getPeers();

                for (let i=0;i<peers.length;i++){
                    channel.removePeer(peers[i]);
                }

                for (let key in ccpJSON.peers) {
                    let peerUrl = ccpJSON.peers[key].url;
                    let peerPem = ccpJSON.peers[key].tlsCACerts.pem;
                    channel.addPeer(fabric_client.newPeer(peerUrl, {pem:peerPem}));
                }
                this.Channels[cName] = channel;
            }


            let fabric_client = await this.GateWays[gName].getClient();


            let transactionID = fabric_client.newTransactionID(true);
            let proposalObj = {
                targets: this.Channels[cName].getChannelPeers(),
                chaincodeId: contractName,
                chaincodeVersion: chaincodeVersion,
                chaincodeType: chaincodeType,
                txId: transactionID,
                fcn: contractFunctionName,
                args: args
            };
            let proposalRes = await this.Channels[cName].sendTransactionProposal(proposalObj);
            let rawData = await this.Channels[cName].sendTransaction({
                proposalResponses: proposalRes[0],
                proposal: proposalRes[1]
            });

            if (rawData["status"] == 'SUCCESS'){
                return {state:1, message:{transaction_id:transactionID["_transaction_id"]}};
            }
            return {processState:0, message:rawData};
        } catch (error) {
            return {processState:0, message: `transaction>>>>> error: ${error}`};
        }
    }

    /**
     * *    通过区块号查区块
     * @param  {String} walletName          证书存放文件名
     * @param  {String} userLabel           用户证书Label
     * @param  {String} connectionFileName  连接文件名称
     * @param  {String} channelName         通道名称
     * @param  {Number} number              区块号
     * @return {JSON}                       {processState:处理状态, message:消息}
     */
    async queryBlockByBlockID(walletName, userLabel, connectionFileName, channelName, number){
        try {
            let gName = walletName + "*" + userLabel + "*" + connectionFileName;
            let nName = gName + "*" + channelName;

            if (!(gName in this.GateWays)){
                let wallet = new FileSystemWallet(path.join(this.walletPath, walletName));
                let ccpPath = path.resolve(__dirname, "..", this.connectionFilePath, walletName, connectionFileName);

                let gateway = new Gateway();
                await gateway.connect(ccpPath, { wallet: wallet, identity: userLabel, discovery: { enabled: true, asLocalhost: false} });
                this.GateWays[gName] = gateway;
            }

            if (!(nName in this.Networks)){
                this.Networks[nName] = await this.GateWays[gName].getNetwork(channelName);
            }

            let channel = this.Networks[nName].getChannel();
            let block = await channel.queryBlock(number);
            let result = JSON.stringify(
                {
                    header:
                        {
                            number:block.header.number,
                            previous_hash:block.header.previous_hash,
                            data_hash:block.header.data_hash
                        },
                    data:{data:"数据太多超出TLS缓冲区"},
                    metadata:{metadata:"数据太多超出TLS缓冲区"}
                });
            return {processState:1, message:result};
        } catch (error) {
            return {processState:0, message: `queryBlockByBlockID>>>>> error: ${error}`};
        }
    }

    /**
     * *    通过交易ID来查块
     * @param  {String} walletName          证书存放文件名
     * @param  {String} userLabel           用户证书Label
     * @param  {String} connectionFileName  连接文件名称
     * @param  {String} channelName         通道名称
     * @param  {String} txid                交易ID
     * @return {JSON}                       {processState:处理状态, message:消息}
     */
    async queryBlockByTxID(walletName, userLabel, connectionFileName, channelName, txid){
        try {
            let gName = walletName + "*" + userLabel + "*" + connectionFileName;
            let nName = gName + "*" + channelName;

            if (!(gName in this.GateWays)){
                let wallet = new FileSystemWallet(path.join(this.walletPath, walletName));
                let ccpPath = path.resolve(__dirname, "..", this.connectionFilePath, walletName, connectionFileName);

                let gateway = new Gateway();
                await gateway.connect(ccpPath, { wallet: wallet, identity: userLabel, discovery: { enabled: true, asLocalhost: false} });
                this.GateWays[gName] = gateway;
            }

            if (!(nName in this.Networks)){
                this.Networks[nName] = await this.GateWays[gName].getNetwork(channelName);
            }

            let channel = this.Networks[nName].getChannel();
            let block = await channel.queryBlockByTxID(txid);
            let result = JSON.stringify(
                {
                    header:
                        {
                            number:block.header.number,
                            previous_hash:block.header.previous_hash,
                            data_hash:block.header.data_hash
                        },
                    data:{data:"数据太多超出TLS缓冲区"},
                    metadata:{metadata:"数据太多超出TLS缓冲区"}
                });
            return {processState:1, message:result};
        } catch (error) {
            return {processState:0, message: `queryBlockByTxID>>>>> error: ${error}`};
        }
    }

    /**
     * *    通过区块HASH来查块
     * @param  {String} walletName          证书存放文件名
     * @param  {String} userLabel           用户证书Label
     * @param  {String} connectionFileName  连接文件名称
     * @param  {String} channelName         通道名称
     * @param  {String} hash                区块HASH
     * @return {JSON}                       {processState:处理状态, message:消息}
     */
    async queryBlockByBlockHash(walletName, userLabel, connectionFileName, channelName, hash){
        try {
            let gName = walletName + "*" + userLabel + "*" + connectionFileName;
            let nName = gName + "*" + channelName;

            if (!(gName in this.GateWays)){
                let wallet = new FileSystemWallet(path.join(this.walletPath, walletName));
                let ccpPath = path.resolve(__dirname, "..", this.connectionFilePath, walletName, connectionFileName);

                let gateway = new Gateway();
                await gateway.connect(ccpPath, { wallet: wallet, identity: userLabel, discovery: { enabled: true, asLocalhost: false} });
                this.GateWays[gName] = gateway;
            }

            if (!(nName in this.Networks)){
                this.Networks[nName] = await this.GateWays[gName].getNetwork(channelName);
            }

            let channel = this.Networks[nName].getChannel();
            let block = await channel.queryBlockByHash(hash);
            let result = JSON.stringify(
                {
                    header:
                        {
                            number:block.header.number,
                            previous_hash:block.header.previous_hash,
                            data_hash:block.header.data_hash
                        },
                    data:{data:"数据太多超出TLS缓冲区"},
                    metadata:{metadata:"数据太多超出TLS缓冲区"}
                });
            return {processState:1, message:result};
        } catch (error) {
            return {processState:0, message: `queryBlockByBlockHash>>>>> error: ${error}`};
        }
    }

    /**
     * *    查询证书
     * @param  {String} walletName  证书存放文件名
     * @param  {String} userLabel   用户证书Label
     * @return {JSON}               {processState:处理状态, message:消息}
     */
    async queryCertificate(walletName, userLabel){
        try {
            // 初始化文件系统
            let walletPath = path.resolve(__dirname, "..", this.walletPath, walletName);
            let wallet = new FileSystemWallet(walletPath);
            // 判断证书是否存在
            let userExists = wallet.exists(userLabel);
            if (!userExists) {
                return {processState:0, message: `queryCertificate>>>>>${userLabel}用户证书不存在`};
            }
            return {processState:1, message:"证书存在"};
        } catch (error) {
            return {processState:0, message: `queryCertificate>>>>> error: ${error}`};
        }
    }

    /**
     * *    登记证书
     * @param  {String} walletName              证书存放文件名
     * @param  {String} userLabel               用户证书Label
     * @param  {String} connectionFileName      连接文件名称
     * @param  {String} caUrl                   CA的URL
     * @param  {String} userSecret              用户密码
     * @param  {String} mspId                   mspId
     * @param  {String} csr                     证书签名请求
     * @return {JSON}                           {processState:处理状态, message:消息}
     */
    async enrollCertificate(walletName, userLabel, connectionFileName, caUrl, userSecret, mspId, csr=""){
        try {
            // 初始化文件系统
            let walletPath = path.resolve(__dirname, "..", this.walletPath, walletName);
            let wallet = new FileSystemWallet(walletPath);

            // 判断证书是否存在
            let userExists = await wallet.exists(userLabel);
            if (userExists) {
                return {processState:0, message: `enrollCertificate>>>>>${userLabel}用户证书已存在`};
            }

            let ccpPath = path.resolve(__dirname, "..", this.connectionFilePath, walletName, connectionFileName);
            let ccpJSON = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
            let caInfo = ccpJSON.certificateAuthorities[caUrl];

            let ca = new FabricCAServices(caInfo.url, {
                trustedRoots: caInfo.tlsCACerts.pem,
                verify: false
            }, caInfo.caName);

            /**
             * 本地生成私钥和证书签名请求，将证书签名发送个ca从而获得证书的方式。
             * admin.csr值证书签名请求。
             * **/
            if (csr != "") {
                let csr = fs.readFileSync('./Court/admin.csr', 'utf8');
                let req = {
                    enrollmentID: userLabel,
                    enrollmentSecret: userSecret,
                    csr: csr,
                };
                let enrollment = await ca.enroll(req);
                return enrollment;
            }

            let enrollment = await ca.enroll({enrollmentID: userLabel, enrollmentSecret: userSecret})
            let identity = X509WalletMixin.createIdentity(mspId, enrollment.certificate, enrollment.key.toBytes());
            await wallet.import(userLabel, identity);
            return {processState:1, message:"登记证书成功，证书已存入内存"};
        } catch (error) {
            return {processState:0, message: `enrollCertificate>>>>> error: ${error}`};
        }
    }

    /**
     * *    注册证书
     * @param  {String} walletName              证书存放文件名
     * @param  {String} adminLabel              管理员证书Label
     * @param  {String} connectionFileName      连接文件名称
     * @param  {String} caUrl                   CA的URL
     * @param  {String} userLabel               用户证书Label
     * @param  {String} role                    用户角色
     * @param  {String} affiliation             用户部门
     * @param  {String} mspId                   用户组织
     * @param  {String} attribute               用户属性
     * @return {JSON}                           {processState:处理状态, message:消息}
     */
    async registerCertificate(walletName, adminLabel, connectionFileName, caUrl, userLabel, role, affiliation, mspId, attribute=""){
        try {
            // 初始化文件系统
            let walletPath = path.resolve(__dirname, "..", this.walletPath, walletName);
            let wallet = new FileSystemWallet(walletPath);

            // 判断管理员证书是否存在
            let adminExists = await wallet.exists(adminLabel);
            if (!adminExists) {
                return {processState:0, message: `registerCertificate>>>>>${adminLabel}管理员证书不存在`};
            }
            // 判断用户证书是否存在
            let userExists = await wallet.exists(userLabel);
            if (userExists) {
                return {processState:0, message: `registerCertificate>>>>>${userLabel}用户证书已存在`};
            }

            let ccpPath = path.resolve(__dirname, "..", this.connectionFilePath, walletName, connectionFileName);
            let gateway = new Gateway();
            await gateway.connect(ccpPath, {
                wallet,
                identity: adminLabel,
                discovery: {enabled: true, asLocalhost: false}
            });
            let ca = gateway.getClient().getCertificateAuthority(caUrl);
            let secret;
            if (attribute!=""){
                secret = await ca.register({ enrollmentID: userLabel, role: role, maxEnrollments:-1, affiliation:affiliation, attrs:attribute},
                    gateway.getCurrentIdentity()
                );
            }else{
                secret = await ca.register({ enrollmentID: userLabel, role: role, maxEnrollments:-1, affiliation:affiliation},
                    gateway.getCurrentIdentity()
                );
            }
            let enrollment = await ca.enroll({ enrollmentID: userLabel, enrollmentSecret: secret});
            await wallet.import(userLabel, X509WalletMixin.createIdentity(mspId, enrollment.certificate, enrollment.key.toBytes()));
            return {processState:1, message:"注册证书成功，证书已存入内存"};
        } catch (error) {
            return {processState:0, message: `registerCertificate>>>>> error: ${error}`};
        }
    }

    byteToString(arr) {
        if(typeof arr === 'string') {
            return arr;
        }
        let str = '',
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

    randomNum(minNum, maxNum){
        switch(arguments.length){
            case 1:
                return parseInt(Math.random()*minNum+1,10);
                break;
            case 2:
                return parseInt(Math.random()*(maxNum-minNum+1)+minNum,10);
                break;
            default:
                return 0;
                break;
        }
    }
    toString(){
        return `FabricSdk GateWays:${this.GateWays.length}`;
    }
}

module.exports = FabricSdk;


const profiler = require("v8-profiler-node8");
const Bluebird = require("bluebird");
// test();
async function test() {
    cpuProf(30000);
    console.log("=================================初始化==================================");
    const SDK = new FabricSdk();
    await SDK.loadGateWays("static/wallet", "static/connection_file");
    console.log("=================================查询==================================");
    for (let i=0;i<10000;i++){
        await SDK.queryData("Court", "cups", "connection-court.json", "mychannel", "zhh", "query", "1000")
            .then(function (data) {
                console.log(data);
            },function (error) {
                console.log(error);
            });
    }
    console.log("=================================交易==================================");
    // SDK.transaction("Court","cups", "connection-court.json", "mychannel","zhh","1","golang", "InitMember", ["5","1000"])
    //     .then(function (data) {
    //         console.log(data);
    //     },function (error) {
    //         console.log(error);
    //     });
    console.log("=================================通过区块号来查块==================================");
    // SDK.queryBlockByBlockID("Court","cups", "connection-court.json", "mychannel",0)
    //     .then(function (data) {
    //         console.log(data);
    //     },function (error) {
    //         console.log(error);
    //     });
    console.log("=================================通过交易ID来查块==================================");
    // SDK.queryBlockByTxID("Court","cups", "connection-court.json", "mychannel","39e9e4e4bb6c2d62a24d4d9bf753bdac6b19aca6b7b2a93f1803c932bd049f2d")
    //     .then(function (data) {
    //         console.log(data);
    //     },function (error) {
    //         console.log(error);
    //     });
    console.log("=================================通过区块Hash来查块(暂时不行)==================================");
    SDK.queryBlockByBlockHash()
        .then(function (data) {
            console.log(data);
        },function (error) {
            console.log(error);
        });
    console.log("=================================用户是否存在==================================");
    // SDK.queryCertificate("Court","admin")
    //     .then(function (data) {
    //         console.log(data);
    //     },function (error) {
    //         console.log(error);
    //     });
    console.log("=================================登记管理员==================================");
    // SDK.enrollCertificate("Court","admin", "connection-court.json", "ca.court.com", "adminpw","CourtMSP")
    //     .then(function (data) {
    //         console.log(data);
    //     },function (error) {
    //         console.log(error);
    //     });
    console.log("=================================注册用户==================================");
    // SDK.registerCertificate("Court", "admin", "connection-court.json", "ca.court.com", "cups", "client", "org1.department1","CourtMSP")
    //     .then(function (data) {
    //         console.log(data);
    //     },function (error) {
    //         console.log(error);
    //     });
}

async function cpuProf(time) {
    console.log('开始收集');
    // Start Profiling
    profiler.startProfiling("CPU profile");
    await Bluebird.delay(time);
    const profile = profiler.stopProfiling();
    profile.export(function(error, result) {
        fs.writeFileSync(`workerProcess-${process.pid}.json`, result);
        profile.delete();
    });
}
