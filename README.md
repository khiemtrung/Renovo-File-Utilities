# ✧ Renovo ✧

**Renovo** is a premium, open-source batch file processor built with **Go (Wails)** and **React (Vite)**. It combines the raw power of the Go standard library with a high-performance, aesthetically pleasing UI designed for production workflows.

![Renovo Preview](https://via.placeholder.com/1280x800/0f172a/f1f5f9?text=Renovo+-+Premium+Batch+Processor)

## ✨ Features

### 📁 Advanced File Exploration
- **Integrated Sidebar**: Browse your filesystem directly within the app.
- **Smart Selection**: Multi-select files using the checkbox system.
- **Shift + Click**: Rapidly select ranges of files just like your OS explorer.

### 📝 Powerful Renaming Rules
- **Replace**: Standard search-and-replace or powerful **Regex** support.
- **Affixes**: Quickly prepend or append strings to filenames.
- **Case Transformation**: Toggle between Title Case, UPPERCASE, lowercase, and Sentence case.
- **Sequential Numbering**: 
    - Custom start numbers.
    - Zero padding (e.g., `001`, `002`).
    - Custom separators.

### 🖼️ Production-Grade Image Resizer
- **Modes**:
    - **Fit**: Scale within bounds while preserving aspect ratio.
    - **Fill**: Smart center-crop to exact dimensions.
    - **Exact**: Stretch to specific pixel counts.
- **Aspect Ratio Locking**: Link width and height to maintain proportions automatically.
- **Format Conversion**: Convert files to **JPEG** or **PNG** on the fly.
- **Quality Control**: Adjustable JPEG compression quality.
- **Output Management**: Overwrite originals or save to a custom directory.

### ⚡ Performance & UX
- **Live Preview**: See your changes in the queue before applying.
- **Batch Processing**: Handle hundreds of files in seconds.
- **Native Experience**: Native OS dialogs and high-performance Go backend.
- **Premium UI**: Sleek dark mode, glassmorphism elements, and smooth micro-animations.

---

## 🚀 Getting Started

### Prerequisites
- [Go](https://go.dev/dl/) 1.24+
- [Node.js](https://nodejs.org/) & NPM
- [Wails CLI](https://wails.io/docs/gettingstarted/installation)

### 🛠️ Build & Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/renovo.git
   cd renovo
   ```

2. **Run in development mode**:
   ```bash
   wails dev
   ```

3. **Build target binaries**:

#### 🍎 macOS
```bash
# Creates a standalone .app bundle
wails build

# For both Intel and Apple Silicon
wails build -platform darwin/universal
```
*Output location: `build/bin/renovo.app`*

#### 🪟 Windows
```bash
# Creates a standalone .exe file
wails build
```
*Output location: `build/bin/renovo.exe`*

#### 🐧 Linux
```bash
wails build
```
*Output location: `build/bin/renovo`*

## 🛠️ Tech Stack
- **Backend**: Go (Golang)
- **Frontend**: React, TypeScript, Vite
- **Styling**: Vanilla CSS (Custom System), Lucide Icons
- **Framework**: Wails v2
- **Image Processing**: [Imaging](https://github.com/disintegration/imaging)
- **Database**: SQLite (Modernc)

## 🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request. 

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License
Distributed under the MIT License. See `LICENSE` for more information.

---