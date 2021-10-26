/**
 * @Author: cups
 * @Description:
 * @File:  client
 * @Version: 1.0.0
 * @Date: 2020/11/3 15:02
 **/
const io = require('socket.io-client');
const socket = io('http://localhost:4000');
const Constant = require('../src/constant.js');

console.log(Constant);
// socket.emit(Constant.MANAGE_TLS_INIT, {pid:process.pid,message:`tlsProcess: PID ${process.pid}>>>>>初始化成功`});
// socket.on(Constant.TLS_RES_MESSAGE, data => {
//     console.log(data);
// });
