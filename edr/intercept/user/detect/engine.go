package detect

import "intercept/user/types"

func Run(e types.Event) []types.Detection {
	var detections []types.Detection

	for _, rule := range Rules {
		if rule.Match(e) {
			detections = append(detections, rule.Detection)
		}
	}

	return detections
}
