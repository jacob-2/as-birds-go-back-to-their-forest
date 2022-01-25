package main

import (
	"encoding/json"
	"sync/atomic"
)

type AtomicBytes struct{atomic.Value}

var state = [6]AtomicBytes{}
func init() {
	for i := 0; i<6; i++ {
		state[i].Store([]byte{})
	}
}

func (s AtomicBytes) MarshalJSON() ([]byte, error) {
	byts := s.Load().([]byte)
	return json.Marshal(string(byts))
}