package renamer

import (
	"fmt"
	"path/filepath"
	"regexp"
	"strings"
)

type RenameRule struct {
	ID           string `json:"id"`
	Type         string `json:"type"` // "replace", "affixes", "case", "sequence"
	Enabled      bool   `json:"enabled"`
	Search       string `json:"search"`  // For replace
	Replace      string `json:"replace"` // For replace
	UseRegex     bool   `json:"useRegex"`
	Prefix       string `json:"prefix"`   // For affixes
	Suffix       string `json:"suffix"`   // For affixes
	CaseType     string `json:"caseType"` // "upper", "lower", "title", "sentence"
	SeqStart     int    `json:"seqStart"`
	SeqPad       int    `json:"seqPad"`
	SeqSeparator string `json:"seqSeparator"`
}

func ApplyRules(filename string, rules []RenameRule, index int) string {
	ext := filepath.Ext(filename)
	name := strings.TrimSuffix(filename, ext)

	for _, rule := range rules {
		if !rule.Enabled {
			continue
		}
		switch rule.Type {
		case "replace":
			if rule.UseRegex {
				re, err := regexp.Compile(rule.Search)
				if err == nil {
					name = re.ReplaceAllString(name, rule.Replace)
				}
			} else {
				if rule.Search != "" {
					name = strings.ReplaceAll(name, rule.Search, rule.Replace)
				}
			}
		case "affixes":
			name = rule.Prefix + name + rule.Suffix
		case "case":
			switch rule.CaseType {
			case "upper":
				name = strings.ToUpper(name)
			case "lower":
				name = strings.ToLower(name)
			case "title":
				words := strings.Fields(name)
				for i, w := range words {
					if len(w) > 0 {
						words[i] = strings.ToUpper(string(w[0])) + strings.ToLower(w[1:])
					}
				}
				name = strings.Join(words, " ")
			case "sentence":
				if len(name) > 0 {
					name = strings.ToUpper(string(name[0])) + strings.ToLower(name[1:])
				}
			}
		case "sequence":
			val := rule.SeqStart + index
			format := fmt.Sprintf("%%s%%0%dd", rule.SeqPad)
			name = fmt.Sprintf(format, name+rule.SeqSeparator, val)
		}
	}

	return name + ext
}
