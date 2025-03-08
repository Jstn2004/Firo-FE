import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, NgZone, NgModule } from '@angular/core';
import { io } from 'socket.io-client';
import * as fabric from 'fabric';
import { CommonModule } from '@angular/common';
import { FormsModule} from '@angular/forms';
import { SocketService } from '../../services/socket.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-canvas',
  templateUrl: './canvas.component.html',
  styleUrls: ['./canvas.component.scss'],
  imports: [CommonModule, FormsModule]
})
export class CanvasComponent implements OnInit, OnDestroy, AfterViewInit {

  private socket: any;
  private canvas!: fabric.Canvas;
  colors = ['#000000', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'];
  public brushwidth = 5;
  public roomId = 'XXXX';
  showForm = true;
  password = '****';
  text = '';
  public name = '';
  members: string[] = []; 
  roomIdtext: string = '';

  @ViewChild('canvas', { static: true }) canvasRef: ElementRef | undefined;

  roomCreatedSubscription: Subscription | undefined; 
  roomJoinedSubscription: Subscription | undefined; 
  roomMembersSubscription: Subscription | undefined;
  roomNotFoundSubscription: Subscription | undefined;
  roomExistsSubscription: Subscription | undefined;
  clearCanvasSubscription: Subscription | undefined;

  constructor(private ngZone: NgZone, public socketService: SocketService) { }

  ngOnInit(): void {
 
  }

  ngAfterViewInit(): void {
    if (this.canvasRef) {
      this.initCanvas();
      this.listenToDrawingUpdates();

    } else {
      console.error('Canvas element not found.');
    }
  }

  ngOnDestroy(): void {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  private initCanvas(): void {
    this.canvas = new fabric.Canvas(this.canvasRef!.nativeElement, {
      backgroundColor: "#ffffff",
      width: 1200,
      height: 600,
      isDrawingMode: true,
    });
    if (this.canvas.isDrawingMode) {
      const brush = new fabric.PencilBrush(this.canvas);
      brush.width = 5;   // Pinselgröße
      brush.color = '#000000';  // Farbe
      this.canvas.freeDrawingBrush = brush;
  
      console.log('Manuell Pinselgröße und Farbe gesetzt');
    } else {
      console.error('Zeichenmodus ist nicht aktiviert');
    }
    if (this.canvas.isDrawingMode) {
      console.log('Zeichenmodus ist aktiviert');
    }
    this.canvas.renderAll();

    this.canvas.on('path:created', (event) => {
      const pathData = {
        path: event.path.toJSON(), 
        color: this.canvas.freeDrawingBrush!.color,
        width: this.canvas.freeDrawingBrush!.width,
      };
      this.socketService.sendDrawingData(pathData);
    });
  }

  public clearCanvas(): void {
    this.socketService.cleanCanvas();
    this.clearCanvasSubscription = this.socketService.onClearCanvas().subscribe(data => {
      console.log('Canvas wird gelöscht' + data);
      this.canvas.clear();
      this.canvas.backgroundColor = '#ffffff';
      this.canvas.renderAll();
    });
  }

  public changeColor(color: string): void {
    if (this.canvas.freeDrawingBrush) {
      this.canvas.freeDrawingBrush.color = color;
    }
  }

  changeBrushSize(size: any) {
      this.canvas.freeDrawingBrush!.width = size; 
  }

  createRoom(): void {
    this.socketService.createRoom(this.roomId);
    this.roomCreatedSubscription = this.socketService.onRoomCreated().subscribe(data => {
      console.log(`Raum ${data.roomId} wurde erstellt.`);
      this.roomIdtext = data.roomId;
      this.showForm = false;
    });
    this.roomMembersSubscription = this.socketService.onRoomMembers().subscribe(data => {
      console.log(`Raummitglieder: ${data.members}`);
      this.members = data.members;
    });

    this.roomExistsSubscription = this.socketService.onRoomExists().subscribe(data => { 
      console.log(`Raum ${data.roomId} existiert bereits.`);
      this.text = "Raum existiert bereits.";
    }
    );
  }

  joinRoom(): void {
    this.socketService.joinRoom(this.roomId);
    console.log(this.name);
    this.roomJoinedSubscription = this.socketService.onRoomJoined().subscribe(data => {
      console.log(`Benutzer ist dem Raum ${data.roomId} beigetreten.`);
      this.roomIdtext = data.roomId;
      this.showForm = false;
    });

    this.roomMembersSubscription = this.socketService.onRoomMembers().subscribe(data => {
      console.log(`Raummitglieder: ${data.members}`);
      this.members = data.members;
    });

    this.roomNotFoundSubscription = this.socketService.onRoomNotFind().subscribe(data => {
      console.log(`Raum ${data.roomId} nicht gefunden.`);
      this.text = "Raum nicht gefunden.";
    });
  }


  private listenToDrawingUpdates(): void {
    this.socketService.onDrawing().subscribe((data: any) => {
      const fabricPath = new fabric.Path(data.path.path, {
        stroke: data.color,
        strokeWidth: data.width,
        fill: null,
        selectable: false,
      });
      this.canvas.add(fabricPath); // Füge den gezeichneten Pfad zum Canvas hinzu
    });
  }

  leave(): void {
    window.location.reload();
  
  }

  
}