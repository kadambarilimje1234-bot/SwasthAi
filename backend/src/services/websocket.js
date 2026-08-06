// WebSocket service for real-time updates
const { io } = require('../../server');

class WebSocketService {
  // Emit vitals update to a specific ward
  emitVitalsUpdate(ward, data) {
    io.to(`ward-${ward}`).emit('vitals-updated', data);
    io.to(`patient-${data.patientId}`).emit('patient-vitals-updated', data);
    io.emit('global-vitals-update', data);
  }

  // Emit alert to specific ward
  emitAlert(ward, data) {
    io.to(`ward-${ward}`).emit('new-alert', data);
    io.emit('global-alert', data);
  }

  // Emit prediction result
  emitPrediction(data) {
    io.to(`patient-${data.patientId}`).emit('prediction-received', data);
    io.emit('global-prediction', data);
  }

  // Join a socket to a room
  joinRoom(socket, room) {
    socket.join(room);
    console.log(`Socket ${socket.id} joined room: ${room}`);
  }

  // Leave a room
  leaveRoom(socket, room) {
    socket.leave(room);
    console.log(`Socket ${socket.id} left room: ${room}`);
  }
}

module.exports = new WebSocketService();