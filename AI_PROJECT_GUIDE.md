# Guía del Proyecto para Asistente AI

Este archivo sirve como una referencia rápida sobre la estructura, tecnologías y el estado reciente del proyecto.

## Descripción General

El proyecto está estructurado como un monorepo con dos partes principales: un frontend y un backend, ubicados en sus respectivos directorios.

## Frontend (`frontend/`)

*   **Tecnologías:** React, TypeScript, Vite, Material UI, Tailwind CSS, React Router, Chart.js, Axios.
*   **Propósito:** Proporciona la interfaz de usuario para interactuar con la aplicación. Incluye paneles para visualizar y gestionar "Equipos" (productos), ver detalles, configurar opcionales, y posiblemente tareas administrativas. Se comunica con el backend mediante una API REST.
*   **Scripts Clave (ejecutar dentro de `frontend/`):**
    *   `npm run dev`: Inicia el servidor de desarrollo de Vite.
    *   `npm run build`: Compila la aplicación para producción.
*   **Estado:** Se corrigieron errores de build relacionados con la resolución de módulos.

## Backend (`backend/`)

*   **Tecnologías:** Node.js, Express, Axios, CORS, dotenv, node-fetch.
*   **Propósito:** Expone una API REST consumida por el frontend. Maneja la lógica de negocio, como obtener datos de productos (posiblemente desde una fuente externa o caché), detalles, opcionales, y gestionar la configuración.
*   **Scripts Clave (ejecutar dentro de `backend/`):**
    *   `npm run start`: Inicia el servidor Express.
*   **Punto de Entrada:** `server.js`

## Último Arreglo Aplicado (2024-08-17)

*   **Problema:** El frontend presentaba errores durante el proceso de build (`npm run build` o `npm run dev`) relacionados con la resolución de módulos/paquetes (`@remix-run/router`, `react-router`, `react-dom`).
*   **Solución:** Se realizó una reinstalación limpia de las dependencias del frontend:
    1.  Se eliminó el archivo `frontend/package-lock.json`.
    2.  Se eliminó la carpeta `frontend/node_modules` (usando `Remove-Item -Recurse -Force node_modules` en PowerShell).
    3.  Se ejecutó `npm install` dentro del directorio `frontend/`.
*   **Resultado:** Esto resolvió los errores de build y permitió que el servidor de desarrollo funcionara correctamente. 