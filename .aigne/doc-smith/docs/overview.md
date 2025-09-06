# Overview

The `@blocklet/uploader` and `@blocklet/uploader-server` packages provide a comprehensive, robust, and extensible file upload solution for Blocklet applications. Built on top of the popular [Uppy](https://uppy.io/) file uploader, this toolkit simplifies the integration of rich upload experiences, from simple file inputs to complex multi-source dashboards with image editing and resumable uploads.

This documentation will guide you through setting up both the frontend and backend components to create a seamless file management workflow.

## Core Packages

The solution is split into two primary packages: a frontend component for the user interface and a backend middleware for server-side processing.

<x-cards data-columns="2">
  <x-card data-title="@blocklet/uploader" data-icon="lucide:component">
    The frontend package. It provides a highly customizable React component that handles the entire user-facing upload experience, including file selection, progress tracking, and previews.
  </x-card>
  <x-card data-title="@blocklet/uploader-server" data-icon="lucide:server">
    The backend package. It offers a set of Express middleware to handle incoming file uploads, process them, and integrate with remote sources like Unsplash or direct URLs.
  </x-card>
</x-cards>

## How It Works

At a high level, the frontend `Uploader` component captures user files and uploads them to endpoints handled by the `@blocklet/uploader-server` middleware. The backend processes these files, saves them, and returns metadata to the frontend, which then updates the UI.

```d2
direction: down

User: {
  shape: c4-person
}

App: {
  label: "Your Blocklet Application"
  shape: rectangle

  Uploader-Component: {
    label: "Uploader Component\n(@blocklet/uploader)"
    shape: rectangle
  }

  Backend-Server: {
    label: "Backend Server"
    shape: rectangle

    Uploader-Server: {
      label: "Uploader Middleware\n(@blocklet/uploader-server)"
      shape: hexagon
    }

    Storage: {
      label: "File Storage / DB"
      shape: cylinder
    }
  }
}

User -> App.Uploader-Component: "1. Selects & drops files"
App.Uploader-Component -> App.Backend-Server.Uploader-Server: "2. Uploads file (Tus)"
App.Backend-Server.Uploader-Server -> App.Backend-Server.Storage: "3. Saves file & metadata"
App.Backend-Server.Uploader-Server -> App.Uploader-Component: "4. Returns upload result (URL)"
App.Uploader-Component -> User: "5. Updates UI"

```

## Key Features

<x-cards data-columns="2">
  <x-card data-title="Extensible Plugin System" data-icon="lucide:puzzle">
    Leverage dozens of Uppy plugins like Webcam, Image Editor, and URL importing, or build your own custom plugins to meet specific needs.
  </x-card>
  <x-card data-title="Resumable Uploads" data-icon="lucide:upload-cloud">
    Powered by the Tus protocol, uploads can be paused and resumed, ensuring reliability even over unstable network connections.
  </x-card>
  <x-card data-title="Remote Source Integration" data-icon="lucide:link">
    Easily configure the Companion middleware to allow users to import files directly from services like Unsplash, Google Drive, or any public URL.
  </x-card>
  <x-card data-title="Decoupled Architecture" data-icon="lucide:split">
    The frontend `@blocklet/uploader` can be used with any Tus-compatible backend. While `@blocklet/uploader-server` is a convenient, ready-to-use solution, it is not a strict dependency.
  </x-card>
</x-cards>

## Next Steps

Ready to get started? Follow our step-by-step guides to integrate the uploader into your Blocklet.

<x-card data-title="Getting Started" data-href="/getting-started" data-icon="lucide:rocket" data-cta="Start Building">
  Jump into our guides to set up the frontend component and backend middleware in under 30 minutes.
</x-card>