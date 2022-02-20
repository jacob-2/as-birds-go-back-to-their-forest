// Notes:
// Websocket messages are essentially one-directional:
// - editor clients -> server -> view clients
// Websocket messages begin with one character to designate type:
// - `c` for code updates
// - `f` to indicate the editor should visually flash within the view client
package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
	"github.com/rs/cors"
)

func getID(r *http.Request) (idString string, id int, err error) {
	vars := mux.Vars(r)
	
	idString = vars["id"]
	id, err = strconv.Atoi(idString)
	if len(idString) != 1 || err != nil || id < 1 || id > 6 {
		err = fmt.Errorf("invalid ID received (\"%v\")", idString)
		return
	}
	id--
	return
}

func code(w http.ResponseWriter, r *http.Request) {
	idString, id, err := getID(r)
	if err != nil {
		fmt.Println(err)
		return
	}

	byts, err := io.ReadAll(r.Body)
	if err != nil {
		fmt.Println("Empty body (empty code) received!")
		return
	}
	state[id].Store(byts)

	b := make([]byte, 0, len(byts)+2)
	b = append(b, 'c', idString[0])
	b = append(b, byts...)

	hub.broadcast <- b
	
    w.WriteHeader(http.StatusOK)
}

func peek(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Access-Control-Allow-Origin", "*")
    w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
    w.WriteHeader(http.StatusOK)
	j, err := json.Marshal(state)
	if err != nil {
		return
	}
	w.Write(j)
}

func flash(w http.ResponseWriter, r *http.Request) {
	idString, _, err := getID(r)
	if err != nil {
		fmt.Println(err)
		return
	}
	
	hub.broadcast <- []byte{'f', idString[0]}
	
    w.WriteHeader(http.StatusOK)
}

func main() {
	r := mux.NewRouter()

	r.HandleFunc("/code/{id}", code)
	r.HandleFunc("/flash/{id}", flash)
	r.HandleFunc("/peek", peek)

	r.HandleFunc("/view-ws", viewWs)
	// r.HandleFunc("/view", view)
	r.PathPrefix("/view/").Handler(http.StripPrefix("/view/", http.FileServer(http.Dir("./view"))))


	// r.HandleFunc("/editor", editor)
	r.PathPrefix("/editor/").Handler(http.StripPrefix("/editor/", http.FileServer(http.Dir("./editor"))))

	http.Handle("/", cors.Default().Handler(r))
	go wsLoop()
	fmt.Println(http.ListenAndServe(":8090", nil))
}


// func editor(w http.ResponseWriter, r *http.Request) {
// 	file := "./editor/editor.html"
// 	fileBytes, err := ioutil.ReadFile(file)
// 	if err != nil {
// 		fmt.Println(err)
// 		return
// 	}
// 	w.Header().Set("Content-Type", "text/html; charset=UTF-8")
// 	w.Header().Set("Content-Disposition", "attachment; filename=\"editor.html\"")
// 	w.Header().Set("Expires", "0")
// 	w.Header().Set("Content-Length", strconv.Itoa(len(fileBytes)))
// 	w.Header().Set("Cache-Control", "no-store")
// 	http.ServeContent(w, r, file, time.Now(), bytes.NewReader(fileBytes))
// }