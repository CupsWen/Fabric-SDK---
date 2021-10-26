'use strict'
/**
 * @Author: cups
 * @Description:
 * @File:  constant
 * @Version: 1.0.0
 * @Date: 2020/10/23 16:05
 **/

var fs = require('fs');
const path = require('path');

const configurePath = path.resolve(__dirname, "..", 'configure.json');
const configure = JSON.parse(fs.readFileSync(configurePath));

/**
 *  服务器基本配置
 **/

const NAME = configure.name;
const PROCESS_COMMUNICATION_PORT = configure.port.process_communication_port;
const TLS_PORT = configure.port.tls_port;
const WEB_PORT = configure.port.web_port;
const TLS_KEY = fs.readFileSync(path.resolve(__dirname, "..", configure.certificate.tls_key));
const TLS_CERT = fs.readFileSync(path.resolve(__dirname, "..", configure.certificate.tls_cert));
const TLS_CA = fs.readFileSync(path.resolve(__dirname, "..", configure.certificate.tls_ca));
const CCP = configure.connection_file_path;
const WALLET_PATH = configure.wallet_path;
const WORKER_PROCESS_NUMBER = configure.worker_process_number;
const POLLING_TIME = configure.monitor.polling_time;
const EMAIL_ADDRESS = configure.monitor.email_address;
const LIMIT_MEM = configure.monitor.limit_mem;

/**
 *  TLS进程和MESSAGE进程通信的消息
 *  消息队列中的消息
 * **/
const QUERY_CERTIFICATE = 0;                // 查询证书
const REGISTER_CERTIFICATE = 1;             // 注册证书
const ENROLL_CERTIFICATE = 2;               // 登记证书
const QUERY_BLOCK_BY_BLOCK_ID = 3;          // 通过区块链编号查区块
const QUERY_BLOCK_BY_HASH = 4;              // 通过HASH查区块
const QUERY_BLOCK_BY_TXID = 5;              // 通过交易ID查区块
const QUERY_DATA = 6;                       // 查询数据
const QUERY_HISTORY_DATA = 7;               // 查询历史数据
const TRANSACTION = 8;                      // 交易

/**
 *  进程间通信的的消息类型
 * **/
// 初始化化消息
const MANAGE_TLS_INIT = "MANAGE_TLS_INIT";                                  // 管理进程--TLS通信进程初始化成功消息
const MANAGE_WORKER_INIT = "MANAGE_WORKER_INIT";                            // 管理进程--工作进程初始化成功消息
const MANAGE_MONITOR_INIT = "MANAGE_MONITOR_INIT";                          // 管理进程--监控进程初始化成功消息
const MANAGE_REQ_MESSAGE = "MANAGE_REQ_MESSAGE";                            // 管理进程--请求消息
const MANAGE_WORKER_STOP = "MANAGE_WORKER_STOP";                            // 管理进程--工作进程处理完毕消息
const MANAGE_PROCESS_STATE = "MANAGE_PROCESS_STATE";                        // 管理进程--获取进程工作状态消息
const MANAGE_GET_REQ_MESSAGE_QUEUE = "MANAGE_GET_REQ_MESSAGE_QUEUE";        // 管理进程--获取请求消息队列
const MANAGE_GET_RES_MESSAGE_QUEUE = "MANAGE_GET_RES_MESSAGE_QUEUE";        // 管理进程--获取回应消息队列
const PROCESS_STATE = "PROCESS_STATE";                                      // 管理进程--各进程内存占用状态(中转)

const TLS_RES_MESSAGE = "TLS_RES_MESSAGE";                                  // TLS通信进程--回应消息
const TLS_GET_RES_MESSAGE_QUEUE = "TLS_GET_RES_MESSAGE_QUEUE";              // TLS通信进程--获取回应消息队列
const TLS_GET_PROCESS_STATE = "TLS_GET_PROCESS_STATE";                      // TLS通信进程--获取进程工作状态消息

const WORKER_WORK_MESSAGE = "WORKER_WORK_MESSAGE";                          // 工作进程--工作消息
const WORKER_PROCESS_STATE = "WORKER_PROCESS_STATE";                        // 工作进程--获取进程工作状态消息

const MONITOR_ERROR_MESSAGE = "MONITOR_ERROR_MESSAGE";                      // 监控进程--异常消息
const MONITOR_REQ_MESSAGE_QUEUE = "MONITOR_REQ_MESSAGE_QUEUE";                  // 监控进程--请求消息队列
const MONITOR_RES_MESSAGE_QUEUE = "MONITOR_RES_MESSAGE_QUEUE";              // 监控进程--回应消息队列
const MONITOR_PROCESS_SOCKET_LIST = "MONITOR_PROCESS_SOCKET_LIST";          // 管理进程--各进程通信Socket列表
const MONITOR_PROCESS_STATE = "MONITOR_PROCESS_STATE";                      // 管理进程--进程状态
const MONITOR_PROCESS_PID_LIST = "MONITOR_PROCESS_PID_LIST";                // 管理进程--各进程PID列表
/**
 *  工作进程状态
 * **/
const WORKER_PROCESS_RUN = "RUN";            // 工作进程状态--运行
const WORKER_PROCESS_PAUSE = "PAUSE";        // 工作进程状态--暂停

/**
 *  不同进程的命令行输出颜色
 * **/
const LOG_TLS = "\x1B[31m";                 // TLS          红
const LOG_MANAGE = "\x1B[32m";              // MANAGE       绿
const LOG_WORKER = "\x1B[33m";              // WORKER       黄
const LOG_MONITOR = "\x1B[34m";             // MONITOR      蓝
const LOG_CLIENT = "\x1B[35m";              // MANAGE       紫

module.exports = {
    NAME,
    PROCESS_COMMUNICATION_PORT,
    TLS_PORT,
    WEB_PORT,
    TLS_KEY,
    TLS_CERT,
    TLS_CA,
    CCP,
    WALLET_PATH,
    WORKER_PROCESS_NUMBER,
    POLLING_TIME,
    EMAIL_ADDRESS,
    LIMIT_MEM,
    QUERY_CERTIFICATE,
    REGISTER_CERTIFICATE,
    ENROLL_CERTIFICATE,
    QUERY_BLOCK_BY_BLOCK_ID,
    QUERY_BLOCK_BY_HASH,
    QUERY_BLOCK_BY_TXID,
    QUERY_DATA,
    QUERY_HISTORY_DATA,
    TRANSACTION,
    MANAGE_TLS_INIT,
    MANAGE_WORKER_INIT,
    MANAGE_MONITOR_INIT,
    MANAGE_REQ_MESSAGE,
    MANAGE_WORKER_STOP,
    MANAGE_GET_REQ_MESSAGE_QUEUE,
    MANAGE_GET_RES_MESSAGE_QUEUE,
    MANAGE_PROCESS_STATE,
    PROCESS_STATE,
    TLS_RES_MESSAGE,
    TLS_GET_RES_MESSAGE_QUEUE,
    TLS_GET_PROCESS_STATE,
    WORKER_WORK_MESSAGE,
    WORKER_PROCESS_STATE,
    MONITOR_ERROR_MESSAGE,
    MONITOR_REQ_MESSAGE_QUEUE,
    MONITOR_RES_MESSAGE_QUEUE,
    MONITOR_PROCESS_SOCKET_LIST,
    MONITOR_PROCESS_STATE,
    MONITOR_PROCESS_PID_LIST,
    WORKER_PROCESS_RUN,
    WORKER_PROCESS_PAUSE,
    LOG_TLS,
    LOG_WORKER,
    LOG_MONITOR,
    LOG_MANAGE,
    LOG_CLIENT
};