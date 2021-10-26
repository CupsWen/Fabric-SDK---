/**
 * @Author: cups
 * @Description:
 * @File:  test
 * @Version: 1.0.0
 * @Date: 2020/11/5 8:43
 **/


const ChildProcess = require('child_process');

for(let i=0;i<10;i++){
    ChildProcess.fork("./clientTest2.js");
}
