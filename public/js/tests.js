function floodChat() {
    for(var i = 0; i < 100; i++) {
        socket.emit('chat message', 'ggg' + i);
    }
}