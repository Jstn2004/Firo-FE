// socket.service.ts
import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private socket: Socket;
  private userId: string = Math.random().toString(36).substr(2, 9);
  private roomId = ""; 
  test = ""; 

  constructor() {
    this.socket = io('http://localhost:3000');
    this.socket.on('connect', () => {
      console.log('Verbunden mit Server:', this.socket.id);
    });
    this.socket.on('disconnect', () => {
      console.log('Verbindung getrennt');
    });
  }

  joinRoom(roomId: string): void {
    console.log('Joining room:', roomId);
    this.socket.emit('joinRoom', { roomId, userId: this.userId });
  }

  createRoom(roomId: string): void {
    console.log('Creating room:', roomId);
    this.socket.emit('createRoom', { roomId, userId: this.userId });
  }

 

  onRoomCreated(): Observable<{ roomId: string }> {
    return new Observable(observer => {
      this.socket.on('roomCreated', (data: { roomId: string }) => {
        localStorage.setItem('roomId', data.roomId);
        this.roomId = data.roomId;
        observer.next(data);
      });
    }); 
  }

  onRoomJoined(): Observable<{ roomId: string }> {
    return new Observable(observer => {
      this.socket.on('userJoined', (data: { roomId: string }) => {
        localStorage.setItem('roomId', data.roomId);
        this.roomId = data.roomId;
        observer.next(data);
      });
    });
  }

  onRoomNotFind(): Observable<{ roomId: string }> {
    return new Observable(observer => {
      this.socket.on('roomNotFound', (data: { roomId: string }) => {
        observer.next(data);
      });
    });
  }

  onRoomMembers(): Observable<{ members: string[] }> {
    return new Observable(observer => {
      this.socket.on('roomMembers', (data: { members: string[] }) => {
        observer.next(data);
      });
    });
  }

  onRoomExists(): Observable<{ roomId: string }> {
    return new Observable(observer => {
      this.socket.on('roomExists', (data: { roomId: string }) => {
        observer.next(data);
      });
    });
  }

  sendDrawingData(data: any): void {
    this.socket.emit('drawing', { roomId: this.roomId, data });
  }

  onDrawing(): Observable<any> {
    return new Observable(observer => {
      this.socket.on('drawing', (data) => {
        observer.next(data);
      });
    });
  }

  cleanCanvas(): void {
    console.log('start clearing canvas');
    this.socket.emit('clearCanvas', { roomId: this.roomId });
  }

  onClearCanvas(): Observable<{ roomId: string }> {
    return new Observable(observer => {
      this.socket.on('doClearing', (data: { roomId: string }) => {
        console.log('clearing canvas');
        observer.next(data);
      });
   });
  }

  getSocket(): Socket {
    return this.socket;
  }

  
}