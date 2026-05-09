package utils 

import (
	"net"
 "math/bits"
)

func IPToString(ip uint32) string {
	// TODO: reconsider
	ip = bits.ReverseBytes32(ip);
	return net.IPv4(
		byte(ip>>24),
		byte(ip>>16),
		byte(ip>>8),
		byte(ip),
	).String()
}
