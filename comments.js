//Create web server 
var http = require('http');
var fs = require('fs');
var path = require('path');
var mime = require('mime');
var cache = {};
var chatServer = require('./lib/chat_server');
//404
function send404(response) {
    response.writeHead(404, { 'Content-Type': 'text/plain' });
    response.write('Error 404:resource not found!');
    response.end();
}
//200
function sendFile(response, filePath, fileContents) {
    response.writeHead(200, { "content-type": mime.lookup(path.basename(filePath)) });
    response.end(fileContents);
}
//static
function serveStatic(response, cache, absPath) {
    //判断是否有缓存
    if (cache[absPath]) {
        sendFile(response, absPath, cache[absPath]);
    } else {
        //判断文件是否存在
        fs.exists(absPath, function(exists) {
            if (exists) {
                //读取文件
                fs.readFile(absPath, function(err, data) {
                    if (err) {
                        send404(response);
                    } else {
                        //缓存
                        cache[absPath] = data;
                        //发送文件
                        sendFile(response, absPath, data);
                    }
                });
            } else {
                send404(response);
            }
        });
    }
}
//create server
var server = http.createServer(function(request, response) {
    var filePath = false;
    if (request.url == '/') {
        filePath = 'public/index.html';
    } else {
        filePath = 'public' + request.url;
    }
    var absPath = './' + filePath;
    //返回静态文件
    serveStatic(response, cache, absPath);
});
//listen port
server.listen(3000, function() {
    console.log('Server listening on port 3000.');
});
//启动socket.io服务器
chatServer.listen(server);
==
// Path: lib/chat_server.js
//socket.io
var socketio = require('socket.io');
var io;
var guestNumber = 1;
var nickNames = {};
var namesUsed = [];
var currentRoom = {};
//启动socket.io服务器
exports.listen = function(server) {
    //启动socket.io服务器，允许它搭载在已有的HTTP服务器上
