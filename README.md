# Wakfu LFG (Web)

**Real-time Group Finder for Wakfu MMORPG**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Deployment](https://img.shields.io/badge/ready-GitHub_Pages-green.svg)](#deployment)
[![Version](https://img.shields.io/badge/version-1.1.0-blue.svg)](#)

---

## 📑 Table of Contents

- [Español (ES)](#español-es)
- [English (EN)](#english-en)
- [Français (FR)](#français-fr)
- [Português (PT)](#português-pt)
- [Deployment / Despliegue](#deployment)

---

<a name="español-es"></a>
## 🇪🇸 Español (ES)

### 📖 Descripción

**Wakfu LFG** es una "Single Page Application" (SPA) moderna, construida sin frameworks de alto nivel para maximizar el rendimiento y la ligereza. Centraliza la búsqueda de grupos para mazmorras en el universo de Wakfu, permitiendo a los jugadores gestionar sus personajes y encontrar aliados en tiempo real.

### ✨ Características Principales

- **🤝 Buscador en Tiempo Real**: Sincronización instantánea de grupos y miembros mediante WebSockets.
- **🛡️ Gestión Avanzada de Personajes**: Perfiles detallados con roles de combate, elementos y tipos de daño.
- **🔔 Notificaciones Híbridas**: Sistema de notificaciones integradas en la interfaz y soporte nativo para notificaciones de escritorio.
- **🗺️ Datos de Mazmorras**: Filtrado inteligente por franjas de nivel modulado, stasis y servidores.
- **🔑 Seguridad**: Autenticación fluida mediante Discord OAuth2 con persistencia segura de sesiones.
- **🌍 Totalmente Localizado**: Traducciones completas en cuatro idiomas con soporte para plurals y formatos dinámicos.

### 🛠️ Tecnologías Utilizadas

- **Frontend Core**: Vanilla JavaScript (ES6 Modules)
- **Motor de Estilos**: Vanilla CSS con variables modernas y layouts Flex/Grid.
- **Comunicación**: Socket.io Client para tiempo real y Fetch API para la API REST.
- **Arquitectura**: Enrutador propio con soporte para parámetros dinámicos y estados de carga.
- **SEO**: Gestor dinámico de Meta-tags para previsualizaciones en redes sociales.

---

<a name="english-en"></a>
## 🇬🇧 English (EN)

### 📖 Description

**Wakfu LFG** is a modern Single Page Application (SPA), built without high-level frameworks to maximize performance and minimize overhead. It centralizes dungeon group finding in the Wakfu universe, allowing players to manage their characters and find allies in real-time.

### ✨ Key Features

- **🤝 Real-time Group Finder**: Instant synchronization of groups and members via WebSockets.
- **🛡️ Advanced Character Management**: Detailed profiles including combat roles, elements, and damage types.
- **🔔 Hybrid Notifications**: Integrated UI notification system plus native desktop notification support.
- **🗺️ Dungeon Data**: Smart filtering by modulated level brackets, stasis, and servers.
- **🔑 Security**: Seamless Discord OAuth2 authentication with secure session persistence.
- **🌍 Fully Localized**: Complete translations in four languages with support for plurals and dynamic formatting.

---

<a name="français-fr"></a>
## 🇫🇷 Français (FR)

### 📖 Description

**Wakfu LFG** est une "Single Page Application" (SPA) moderne, conçue sans frameworks lourds pour garantir performance et rapidité. Elle centralise la recherche de groupes pour les donjons de l'univers Wakfu, permettant aux joueurs de gérer leurs personnages et de trouver des alliados en temps réel.

### ✨ Fonctionnalités Principales

- **🤝 Recherche en Temps Réel**: Synchronisation instantanée des groupes et membres via WebSockets.
- **🛡️ Gestion de Personnages**: Profils détaillés avec rôles de combat, éléments et types de dégâts.
- **🔔 Notifications Hybrides**: Système intégré dans l'interface et support des notifications de bureau.
- **🗺️ Données de Donjons**: Filtrage par tranches de niveau modulé, stasis et serveurs.
- **🔑 Authentification**: Connexion via Discord OAuth2 avec persistance session sécurisée.
- **🌍 Multilingue**: Traduction complète en quatre langues (ES, EN, FR, PT).

---

<a name="português-pt"></a>
## 🇵🇹 Português (PT)

### 📖 Descrição

**Wakfu LFG** é uma Single Page Application (SPA) moderna, construída sem frameworks de alto nível para maximizar o desempenho. Centraliza a busca de grupos para calabouços no universo de Wakfu, permitindo que os jogadores gerenciem seus personagens e encontrem aliados em tempo real.

### ✨ Funcionalidades Principais

- **🤝 Busca em Tempo Real**: Sincronização instantânea de grupos e membros via WebSockets.
- **🛡️ Gestão de Personagens**: Perfis detalhados com funções de combate, elementos e tipos de dano.
- **🔔 Notificações Híbridas**: Sistema integrado na interface e suporte para notificações de desktop.
- **🗺️ Dados de Calabouços**: Filtragem inteligente por faixas de nível, stasis e servidores.
- **🔑 Segurança**: Autenticação via Discord OAuth2 com persistência de sessão.

---

<a name="architecture"></a>
## 🏗️ Project Architecture

Unlike traditional React or Vue apps, this project uses a **Modular Vanilla Pattern**:

- **Core Engine**: Located in `js/core/`, managing Routing, i18n, API communication, and WebSocket events.
- **Component System**: Located in `js/components/`, providing reusable UI blocks (Header, Footer, Modals, Cards).
- **Page Logic**: Located in `js/pages/`, each file representing a full view with its own lifecycle (`render` and `afterRender` methods).
- **Event-Driven**: Uses a custom event bus through `Socket.js` and `notifications.js` to update the UI without reloading.

---

<a name="deployment"></a>
## 🚀 Deployment (GitHub Pages)

This project is optimized for **GitHub Pages** deployment:

- **Hash-based Routing**: Browsing to `/#/profile` works perfectly without any server-side configuration for fallbacks.
- **Relative Pathing**: All asset links are relative, supporting deployments in subfolders (e.g., `user.github.io/my-sub-folder/`).
- **Callback Handling**: The login flow uses `returnUrl` logic to ensure Discord redirects back to the correct deployment environment.

---

**⚠️ Disclaimer**: This is an unofficial fan-made tool. Wakfu and all related trademarks are property of Ankama Games. This project is not affiliated with, endorsed by, or sponsored by Ankama.
