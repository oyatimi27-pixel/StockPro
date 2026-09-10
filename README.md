# 📦 StockPro

### Smart Inventory. Better Business.

StockPro is a modern inventory, client and sales management application designed for wholesalers, distributors and growing businesses.

The application helps business owners organize their daily operations, monitor available stock and manage customer and sales information from one central interface.

## 🎯 Project Purpose

Managing stock manually can lead to inaccurate quantities, lost customer information and difficulty tracking business activity.

StockPro was created to provide a structured and user-friendly solution that brings essential business management tools together in one application.

## ✨ Main Features

- 📦 Product and inventory management
- 📊 Stock quantity tracking
- 👥 Client management
- 🧾 Sales management
- 🛒 Order tracking
- 🔔 Low-stock monitoring
- 📈 Business statistics and dashboard
- 🔍 Product and client search
- 💻 Desktop application support
- 📱 Responsive and modern user interface

## 🛠️ Technologies

### Core Technologies

- React
- TypeScript
- HTML5
- CSS3
- JavaScript
- Vite
- Node.js
- npm

### Desktop Technologies

- Electron
- Electron Builder

### Development Approach

StockPro was developed using an AI-assisted workflow with Google AI Studio, followed by manual customization, testing and project organization.

## 📁 Project Structure

```text
StockPro/
├── assets/
├── electron/
├── src/
├── .env.example
├── .gitignore
├── index.html
├── metadata.json
├── package.json
├── package-lock.json
├── server.ts
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## ⚙️ Installation and Setup

### Requirements

Before running the application, install:

- Node.js
- npm
- Git

### Setup Instructions

1. Clone the repository:

```bash
git clone https://github.com/oyatimi27-pixel/StockPro.git
```

2. Open the project directory:

```bash
cd StockPro
```

3. Install the project dependencies:

```bash
npm install
```

4. Check the environment example file:

```text
.env.example
```

5. If the application requires environment variables, create a local `.env` file and add the necessary values.

Never publish real API keys, passwords or private credentials.

6. Start the application in development mode:

```bash
npm run dev
```

7. Open the local URL displayed in the terminal. It will usually resemble:

```text
http://localhost:5173
```

## 🖥️ Desktop Application

StockPro includes Electron support, allowing the project to operate as a desktop application.

The available development and build commands are defined in:

```text
package.json
```

Generated folders such as `dist`, `build` and `release` are excluded from the repository because they can be recreated from the source code.

## 🔐 Environment Variables

The repository includes:

```text
.env.example
```

This file should contain example variable names only.

Real values must be stored locally in:

```text
.env
```

The `.env` file must never be committed to a public repository.

## 📸 Screenshots

Project screenshots will be added soon.

## 🎥 Project Demo

A short demonstration video will be added soon.

## 🚧 Project Status

StockPro is currently under active development and is presented as a portfolio project.

### Planned Improvements

- Improve inventory tracking
- Add advanced low-stock alerts
- Improve client and sales management
- Add invoice generation
- Add sales and profit reports
- Improve data validation
- Strengthen application security
- Add user authentication and authorization
- Add backup and data export features
- Improve desktop application packaging
- Expand automated testing
- Prepare the application for production deployment

## 👨‍💻 Developer

Developed by **Omar YATIMI**.

Business Computing student, web developer and aspiring cybersecurity professional.

## 📄 License

This project is currently provided for portfolio and educational purposes.

All rights reserved unless a separate license is added to the repository.
