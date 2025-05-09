# -*- coding: utf-8 -*-
# Guía del Proyecto para Asistente AI

**Nota Importante:** Todas las respuestas y comunicaciones relacionadas con este proyecto deben ser en **español**.

Este archivo sirve como una referencia rápida sobre la estructura, tecnologías y cómo el Asistente AI puede colaborar en el proyecto.

## Descripción General

El proyecto está estructurado como un monorepo con dos partes principales: un frontend y un backend, ubicados en sus respectivos directorios.
Este Asistente AI está aquí para ayudar con diversas tareas de desarrollo, incluyendo:
*   Análisis de código y estructura del proyecto.
*   Generación y modificación de código.
*   Actualización de documentación (como este mismo archivo y el `project_index.md`).
*   Resolución de problemas y debugging.
*   Proporcionar guía sobre las funcionalidades del proyecto y tecnologías empleadas.

## Frontend (`frontend/`)

*   **Tecnologías:** React, TypeScript, Vite, Material UI (o la librería UI que se esté usando, verificar `theme.ts`), Tailwind CSS (si aplica), React Router, Chart.js (si aplica), Axios.
*   **Propósito:** Proporciona la interfaz de usuario para interactuar con la aplicación. Incluye paneles para visualizar y gestionar "Equipos" (productos), ver detalles, configurar opcionales, y posiblemente tareas administrativas. Se comunica con el backend mediante una API REST.
*   **Scripts Clave (ejecutar dentro de `frontend/`):**
    *   `npm run dev`: Inicia el servidor de desarrollo de Vite.
    *   `npm run build`: Compila la aplicación para producción.

## Backend (`backend/`)

*   **Tecnologías:** Node.js, Express, MongoDB (a través de Mongoose), Axios, CORS, dotenv, bcryptjs.
*   **Propósito:** Expone una API REST consumida por el frontend. Maneja la lógica de negocio, como la gestión de perfiles de costo, productos, usuarios, y la interacción con la base de datos.
*   **Scripts Clave (ejecutar dentro de `backend/`):**
    *   `npm run start` o `npm run dev` (dependiendo de `package.json`): Inicia el servidor Express.
*   **Punto de Entrada:** `server.js`

## Colaboración con el Asistente AI

Para una colaboración efectiva:
*   Proporciona contexto claro sobre las tareas.
*   Especifica los archivos o secciones de código relevantes.
*   Si encuentras errores o necesitas refactorizar, comparte los mensajes de error y el código problemático.
*   Para actualizaciones de documentación, indica qué información ha cambiado o necesita ser añadida.
*   Puedes pedir al AI que analice el estado del proyecto, explore archivos o busque código específico.

El AI puede ayudar a mantener actualizada la documentación del proyecto, como el `project_index.md`, reflejando la estructura actual y los puntos clave del frontend y backend.
Si se realizan cambios significativos en la lógica de negocio, como la de "Costo de Producto", es importante informar al AI para que la documentación (`logica_costo_producto.md`) pueda ser revisada, aunque la validación final de dicha lógica compleja recae en el desarrollador. 