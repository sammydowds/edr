KERNEL_DIR := kernel
USER_DIR   := user

BPF_SRC := $(KERNEL_DIR)/main.c
GO_BINARY := intercept 

all: generate build

deps:
	go install github.com/cilium/ebpf/cmd/bpf2go@latest
	cd $(USER_DIR) && go mod tidy

generate:
	@echo "[*] Generating Go bindings via bpf2go..."
	cd $(USER_DIR) && \
	$(HOME)/go/bin/bpf2go \
		-go-package main \
		-target arm64 \
		-cflags "-I$(abspath $(KERNEL_DIR)/../../..)" \
		intercept ../kernel/main.c

build:
	@echo "[*] Building Go userspace agent..."
	cd $(USER_DIR) && go build -o $(GO_BINARY) .

run: all
	@echo "[*] Starting intercept..."
	sudo ./$(USER_DIR)/$(GO_BINARY)

clean:
	@echo "[*] Cleaning build artifacts..."
	rm -f $(USER_DIR)/$(GO_BINARY)
	rm -f $(USER_DIR)/intercept_bpf*.go
	rm -f $(USER_DIR)/intercept_bpf*.o
