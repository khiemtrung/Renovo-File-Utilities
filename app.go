package main

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"renovo/internal/pkg/db"
	"renovo/internal/pkg/imager"
	"renovo/internal/pkg/renamer"
	"strings"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// App struct
type App struct {
	ctx context.Context
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	err := db.InitDB()
	if err != nil {
		fmt.Printf("Failed to init DB: %v\n", err)
	}
}

// ─── File Info Types ──────────────────────────────────────────────────────────

// FileInfo contains metadata about a file
type FileInfo struct {
	Path      string `json:"path"`
	Name      string `json:"name"`
	Ext       string `json:"ext"`
	SizeBytes int64  `json:"sizeBytes"`
	SizeLabel string `json:"sizeLabel"`
}

// DirEntry represents a filesystem item (file or directory)
type DirEntry struct {
	Name  string `json:"name"`
	Path  string `json:"path"`
	IsDir bool   `json:"isDir"`
	Ext   string `json:"ext"`
	Size  int64  `json:"size"`
}

// RenameResult is returned for each processed file
type RenameResult struct {
	OldPath string `json:"oldPath"`
	NewPath string `json:"newPath"`
	OldName string `json:"oldName"`
	NewName string `json:"newName"`
	Status  string `json:"status"`
	Error   string `json:"error"`
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

func formatBytes(b int64) string {
	const unit = 1024
	if b < unit {
		return fmt.Sprintf("%d B", b)
	}
	div, exp := int64(unit), 0
	for n := b / unit; n >= unit; n /= unit {
		div *= unit
		exp++
	}
	return fmt.Sprintf("%.0f %cB", float64(b)/float64(div), "KMGTPE"[exp])
}

// ─── File System Methods ───────────────────────────────────────────────────────

// GetHomePath returns the user's home directory path
func (a *App) GetHomePath() string {
	home, err := os.UserHomeDir()
	if err != nil {
		return "/"
	}
	return home
}

// ListDirectory returns the contents of a directory
func (a *App) ListDirectory(path string) []DirEntry {
	entries, err := os.ReadDir(path)
	if err != nil {
		return []DirEntry{}
	}
	var result []DirEntry
	// Directories first
	for _, e := range entries {
		if e.IsDir() && !strings.HasPrefix(e.Name(), ".") {
			result = append(result, DirEntry{
				Name:  e.Name(),
				Path:  filepath.Join(path, e.Name()),
				IsDir: true,
			})
		}
	}
	// Then files
	for _, e := range entries {
		if !e.IsDir() && !strings.HasPrefix(e.Name(), ".") {
			info, _ := e.Info()
			var size int64
			if info != nil {
				size = info.Size()
			}
			result = append(result, DirEntry{
				Name:  e.Name(),
				Path:  filepath.Join(path, e.Name()),
				IsDir: false,
				Ext:   strings.ToLower(filepath.Ext(e.Name())),
				Size:  size,
			})
		}
	}
	return result
}

// GetFileInfos returns metadata for a list of file paths
func (a *App) GetFileInfos(paths []string) []FileInfo {
	infos := make([]FileInfo, 0, len(paths))
	for _, p := range paths {
		stat, err := os.Stat(p)
		if err != nil {
			continue
		}
		ext := strings.ToLower(filepath.Ext(p))
		infos = append(infos, FileInfo{
			Path:      p,
			Name:      filepath.Base(p),
			Ext:       ext,
			SizeBytes: stat.Size(),
			SizeLabel: formatBytes(stat.Size()),
		})
	}
	return infos
}

// ─── Rename Methods ───────────────────────────────────────────────────────────

// PreviewRename returns what the new filenames would be, without changing them
func (a *App) PreviewRename(files []string, rules []renamer.RenameRule) []RenameResult {
	results := make([]RenameResult, 0, len(files))
	for i, path := range files {
		oldName := filepath.Base(path)
		newName := renamer.ApplyRules(oldName, rules, i)
		results = append(results, RenameResult{
			OldPath: path,
			NewPath: filepath.Join(filepath.Dir(path), newName),
			OldName: oldName,
			NewName: newName,
			Status:  "preview",
		})
	}
	return results
}

// BatchRename handles multiple file renames
func (a *App) BatchRename(files []string, rules []renamer.RenameRule) []RenameResult {
	results := make([]RenameResult, 0, len(files))
	for i, path := range files {
		dir := filepath.Dir(path)
		oldName := filepath.Base(path)
		newName := renamer.ApplyRules(oldName, rules, i)
		newPath := filepath.Join(dir, newName)

		res := RenameResult{OldPath: path, NewPath: newPath, OldName: oldName, NewName: newName, Status: "success"}

		if oldName != newName {
			err := os.Rename(path, newPath)
			if err != nil {
				res.Status = "error"
				res.Error = err.Error()
			}
		}
		results = append(results, res)
	}
	return results
}

// ─── Image Methods ────────────────────────────────────────────────────────────

// ResizeImages handles batch image resizing (used when called alongside rename)
func (a *App) ResizeImages(files []string, config imager.ResizeConfig) []imager.ResizeResult {
	return resizeBatch(files, config)
}

// ResizeImagesOnly resizes images independently of rename workflow
func (a *App) ResizeImagesOnly(files []string, config imager.ResizeConfig) []imager.ResizeResult {
	// Only pass through image files
	imageExts := map[string]bool{".jpg": true, ".jpeg": true, ".png": true, ".bmp": true, ".gif": true, ".webp": true, ".tiff": true, ".tif": true}
	var imgFiles []string
	for _, f := range files {
		if imageExts[strings.ToLower(filepath.Ext(f))] {
			imgFiles = append(imgFiles, f)
		}
	}
	return resizeBatch(imgFiles, config)
}

func resizeBatch(files []string, config imager.ResizeConfig) []imager.ResizeResult {
	results := make([]imager.ResizeResult, 0, len(files))
	for _, path := range files {
		res, err := imager.ResizeImage(path, config)
		if err != nil {
			res.Status = "error"
			res.Error = err.Error()
			res.OldPath = path
			res.OldName = filepath.Base(path)
		}
		results = append(results, res)
	}
	return results
}

// ─── Dialog Fallbacks (optional, kept for compatibility) ─────────────────────

// SelectFiles opens a native dialog to select multiple files
func (a *App) SelectFiles() []string {
	files, err := runtime.OpenMultipleFilesDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Select Files to Process",
	})
	if err != nil {
		return []string{}
	}
	return files
}

// SelectDirectory opens a native dialog to select a directory
func (a *App) SelectDirectory() string {
	dir, err := runtime.OpenDirectoryDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Select Output Directory",
	})
	if err != nil {
		return ""
	}
	return dir
}
