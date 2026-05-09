package detect

import (
	"strings"

	"intercept/user/types"
)

func EqualsAny(s string, values []string) bool {
	for _, v := range values {
		if s == v {
			return true
		}
	}
	return false
}

func ContainsAny(s string, values []string) bool {
	for _, v := range values {
		if strings.Contains(s, v) {
			return true
		}
	}
	return false
}

var Rules = []Rule{
	{
		ID: "passwd-read",

		Match: func(e types.Event) bool {
			return EqualsAny(e.Comm, []string{"cat"}) &&
				e.Filename == "/etc/passwd"
		},

		Detection: types.Detection{
			RuleID:      "passwd-read",
			RuleName:    "Sensitive File Read",
			Description: "Process accessed /etc/passwd",
			Severity:    "medium",
			Confidence:  85,

			MITRE: types.MITRE{
				TechniqueID:   "T1003",
				TechniqueName: "OS Credential Dumping",
				Tactic:        "Credential Access",
			},
		},
	},

	{
		ID: "curl-network",

		Match: func(e types.Event) bool {
			return e.Source == types.LSM_SOCK_CONNECT &&
				e.Comm == "curl"
		},

		Detection: types.Detection{
			RuleID:      "curl-network",
			RuleName:    "Curl Outbound Connection",
			Description: "curl initiated outbound network connection",
			Severity:    "medium",
			Confidence:  70,

			MITRE: types.MITRE{
				TechniqueID:   "T1105",
				TechniqueName: "Ingress Tool Transfer",
				Tactic:        "Command and Control",
			},
		},
	},

	{
		ID: "wget-network",

		Match: func(e types.Event) bool {
			return e.Source == types.LSM_SOCK_CONNECT &&
				e.Comm == "wget"
		},

		Detection: types.Detection{
			RuleID:      "wget-network",
			RuleName:    "Wget Outbound Connection",
			Description: "wget initiated outbound network connection",
			Severity:    "high",
			Confidence:  90,

			MITRE: types.MITRE{
				TechniqueID:   "T1105",
				TechniqueName: "Ingress Tool Transfer",
				Tactic:        "Command and Control",
			},
		},
	},

	{
		ID: "wget-blocked",

		Match: func(e types.Event) bool {
			return e.Source == types.LSM_SOCK_CONNECT &&
				e.Comm == "wget" &&
				e.Action == 1
		},

		Detection: types.Detection{
			RuleID:      "wget-blocked",
			RuleName:    "Blocked Wget Connection",
			Description: "wget outbound connection was blocked",
			Severity:    "high",
			Confidence:  95,

			MITRE: types.MITRE{
				TechniqueID:   "T1105",
				TechniqueName: "Ingress Tool Transfer",
				Tactic:        "Command and Control",
			},
		},
	},

	{
		ID: "bash-network",

		Match: func(e types.Event) bool {
			return e.Source == types.LSM_SOCK_CONNECT &&
				e.Comm == "bash"
		},

		Detection: types.Detection{
			RuleID:      "bash-network",
			RuleName:    "Shell Network Activity",
			Description: "bash initiated outbound network connection",
			Severity:    "high",
			Confidence:  85,

			MITRE: types.MITRE{
				TechniqueID:   "T1059.004",
				TechniqueName: "Unix Shell",
				Tactic:        "Execution",
			},
		},
	},

	{
		ID: "netcat-network",

		Match: func(e types.Event) bool {
			return e.Source == types.LSM_SOCK_CONNECT &&
				EqualsAny(e.Comm, []string{"nc", "netcat"})
		},

		Detection: types.Detection{
			RuleID:      "netcat-network",
			RuleName:    "Netcat Network Activity",
			Description: "netcat initiated outbound network connection",
			Severity:    "high",
			Confidence:  90,

			MITRE: types.MITRE{
				TechniqueID:   "T1095",
				TechniqueName: "Non-Application Layer Protocol",
				Tactic:        "Command and Control",
			},
		},
	},

	{
		ID: "high-port-connection",

		Match: func(e types.Event) bool {
			return e.Source == types.LSM_SOCK_CONNECT &&
				e.RemotePort >= 4444
		},

		Detection: types.Detection{
			RuleID:      "high-port-connection",
			RuleName:    "Suspicious High Port Connection",
			Description: "Outbound connection to suspicious high port",
			Severity:    "medium",
			Confidence:  60,

			MITRE: types.MITRE{
				TechniqueID:   "T1071",
				TechniqueName: "Application Layer Protocol",
				Tactic:        "Command and Control",
			},
		},
	},
	{
    ID: "ls-sensitive-dir-exploration",

    Match: func(e types.Event) bool {
        if e.Source != types.TRACE_FILE_OPEN {
            return false
        }

        if e.Comm != "ls" {
            return false
        }

        return e.Filename == "/home" ||
        	e.Filename == "/etc" ||
        	e.Filename == "/root"
    },

    Detection: types.Detection{
        RuleID:      "ls-sensitive-dir-exploration",
        RuleName:    "LS Sensitive Directory Exploration",
        Description: "ls is enumerating sensitive system or user directories",
        Severity:    "low",
        Confidence:  40,

        MITRE: types.MITRE{
            TechniqueID:   "T1083",
            TechniqueName: "File and Directory Discovery",
            Tactic:        "Discovery",
        },
    },
	},
}
