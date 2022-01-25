package main

import (
	"fmt"
	"net/http"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {return true},
}

type Hub struct{
	clients map[*websocket.Conn]uint8
	register chan *websocket.Conn
	unregister chan *websocket.Conn
	broadcast chan []byte
}
var hub *Hub
func wsLoop() {
	hub = &Hub{
		clients: make(map[*websocket.Conn]uint8),
		broadcast: make(chan []byte),
		register: make(chan *websocket.Conn),
		unregister: make(chan *websocket.Conn),
	}
	for {
		select {
		case client := <-hub.register:
			hub.clients[client] = 0
		case client := <-hub.unregister:
			delete(hub.clients, client)
		case message := <-hub.broadcast:
			for client := range hub.clients {
				w, err := client.NextWriter(websocket.TextMessage)
				if err != nil {
					hub.clients[client]++
					if hub.clients[client] > 40 {
						delete(hub.clients, client)
					}
					fmt.Println("Client can't create writer")
					continue
				}
				hub.clients[client] = 0
				w.Write(message)
				w.Close()
			}
		}
	}
}

func viewWs(w http.ResponseWriter, r *http.Request) {
	c, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		fmt.Println("upgrade error:", err)
		return
	}
	hub.register <- c
}

func view(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, "./view/view.html")
}
