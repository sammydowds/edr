package detect

import (
	"intercept/user/types"
)

type Rule struct {
	ID        string
	Match     func(types.Event) bool
	Detection types.Detection
}
