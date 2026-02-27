package imager

import (
	"fmt"
	"image"
	"os"
	"path/filepath"
	"strings"

	"github.com/disintegration/imaging"
)

type ResizeConfig struct {
	Width        int    `json:"width"`
	Height       int    `json:"height"`
	KeepAspect   bool   `json:"keepAspect"`
	Quality      int    `json:"quality"`
	OutputFormat string `json:"outputFormat"` // "jpeg", "png", "" (same)
	ResizeMode   string `json:"resizeMode"`   // "fit" (default), "fill" (crop), "exact" (stretch)
	OutputDir    string `json:"outputDir"`    // "" = beside original
	Overwrite    bool   `json:"overwrite"`    // true = overwrite original
}

type ResizeResult struct {
	OldPath      string `json:"oldPath"`
	NewPath      string `json:"newPath"`
	OldName      string `json:"oldName"`
	NewName      string `json:"newName"`
	Status       string `json:"status"`
	Error        string `json:"error"`
	OriginalW    int    `json:"originalW"`
	OriginalH    int    `json:"originalH"`
	OutputW      int    `json:"outputW"`
	OutputH      int    `json:"outputH"`
	OriginalSize int64  `json:"originalSize"`
	OutputSize   int64  `json:"outputSize"`
}

func ResizeImage(inputPath string, config ResizeConfig) (ResizeResult, error) {
	result := ResizeResult{
		OldPath: inputPath,
		OldName: filepath.Base(inputPath),
		Status:  "success",
	}

	// Open source
	src, err := imaging.Open(inputPath)
	if err != nil {
		return result, fmt.Errorf("failed to open image: %v", err)
	}
	srcBounds := src.Bounds()
	result.OriginalW = srcBounds.Dx()
	result.OriginalH = srcBounds.Dy()

	// Original file size
	if fi, err := os.Stat(inputPath); err == nil {
		result.OriginalSize = fi.Size()
	}

	// Validate dimensions
	if config.Width <= 0 && config.Height <= 0 {
		return result, fmt.Errorf("width and height cannot both be 0")
	}

	// Determine output extension
	inExt := strings.ToLower(filepath.Ext(inputPath))
	outExt := inExt
	if config.OutputFormat != "" && config.OutputFormat != "same" {
		outExt = "." + strings.ToLower(config.OutputFormat)
		if outExt == ".jpeg" {
			outExt = ".jpg"
		}
	}

	// Determine output path
	inBase := strings.TrimSuffix(filepath.Base(inputPath), filepath.Ext(inputPath))
	var outputPath string
	if config.Overwrite && config.OutputFormat == "" {
		// Overwrite original in place
		outputPath = inputPath
	} else {
		suffix := "_resized"
		if config.Overwrite {
			suffix = ""
		}
		dir := filepath.Dir(inputPath)
		if config.OutputDir != "" {
			dir = config.OutputDir
		}
		outputPath = filepath.Join(dir, inBase+suffix+outExt)
	}
	result.NewPath = outputPath
	result.NewName = filepath.Base(outputPath)

	// Resize
	mode := config.ResizeMode
	if mode == "" {
		mode = "fit"
	}

	var dst image.Image
	w, h := config.Width, config.Height

	switch mode {
	case "fill":
		// Crop to exact dimensions (center crop)
		if w <= 0 {
			w = h
		}
		if h <= 0 {
			h = w
		}
		dst = imaging.Fill(src, w, h, imaging.Center, imaging.Lanczos)
	case "exact":
		// Stretch to exact dimensions.
		// If one is 0, imaging.Resize will preserve aspect ratio.
		dst = imaging.Resize(src, w, h, imaging.Lanczos)
	default: // "fit"
		if w > 0 && h > 0 {
			dst = imaging.Fit(src, w, h, imaging.Lanczos)
		} else if w > 0 {
			dst = imaging.Resize(src, w, 0, imaging.Lanczos)
		} else {
			dst = imaging.Resize(src, 0, h, imaging.Lanczos)
		}
	}

	outBounds := dst.Bounds()
	result.OutputW = outBounds.Dx()
	result.OutputH = outBounds.Dy()

	// Ensure output directory exists
	if err := os.MkdirAll(filepath.Dir(outputPath), 0755); err != nil {
		return result, fmt.Errorf("failed to create output directory: %v", err)
	}

	// Save
	if strings.HasSuffix(outExt, ".jpg") || strings.HasSuffix(outExt, ".jpeg") {
		quality := config.Quality
		if quality <= 0 {
			quality = 85
		}
		err = imaging.Save(dst, outputPath, imaging.JPEGQuality(quality))
	} else {
		err = imaging.Save(dst, outputPath)
	}
	if err != nil {
		return result, fmt.Errorf("failed to save image: %v", err)
	}

	// Output size
	if fi, err := os.Stat(outputPath); err == nil {
		result.OutputSize = fi.Size()
	}

	return result, nil
}
