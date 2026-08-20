const initSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on('join_table', (tableNumber) => {
      socket.join(`table_${tableNumber}`);
      console.log(`Socket ${socket.id} joined table_${tableNumber}`);
    });

    socket.on('join_order', (orderId) => {
      socket.join(`order_${orderId}`);
    });

    socket.on('join_kitchen', () => {
      socket.join('kitchen');
    });

    socket.on('join_pos', () => {
      socket.join('pos');
    });

    socket.on('join_admin', () => {
      socket.join('admin');
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
};

module.exports = initSocket;
