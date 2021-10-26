/**
 * @Author: cups
 * @Description:
 * @File:  server
 * @Version: 1.0.0
 * @Date: 2020/11/3 15:01
 **/

const io = require("socket.io")(3000);

io.on('connection', socket => {
    console.log(socket.id);

    socket.emit('news', 'Hello');
    socket.on('news', data => {
        console.log(data);
    });
});