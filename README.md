# Product Space

Implementing a product space visualization. This app was set up using Vite (React + TypeScript), with D3.js being used to render SVG graphics. See the live deployed site [here](https://tammy-zhang.com/product-space/). I primarily consulted my own JavaScript code from past projects related to D3.js networks; I also used Copilot to help refactor the code into reusable functions and address data typing bugs.

## Prerequisites
Make sure you have the following installed:
- Node.js (version 16 or higher recommended)
- npm or pnpm or Yarn

## Installation
1. Clone this repository:
```
git clone https://github.com/tammyzhang-1/product-space.git
cd product-space
```
2. Install dependencies:
```
npm install
```

## Running the Application (Development Mode)
Start the development server:
```
npm run dev
```
Then open your browser and navigate to:
```
http://localhost:5173/
```

## Building the Application (Production)
To build the app for production:
```
npm run build
```
The output will be placed in the dist/ directory.

## Previewing the Production Build
After building, preview the production version locally:
```
npm run preview
```

## Project Structure
```
product-space/
├── public/
│   └── index.html         
└── src/
    ├── components/product-space/
    │   ├── ProductSpace.tsx
    │   └── types.tsx
    │
    ├── data/
    │   ├── metadata.json
    │   └── nodes_edges.json
    │
    ├── App.tsx
    └── main.tsx             
```
