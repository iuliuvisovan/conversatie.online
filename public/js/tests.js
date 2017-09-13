function floodChat() {
    for(var i = 0; i < 200; i++) {
        socket.emit('chat message', 'ggg' + i);
    }
}