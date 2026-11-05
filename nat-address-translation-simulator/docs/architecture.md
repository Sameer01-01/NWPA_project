# NAT Address Translation Simulator - Architecture

## Overview
The NAT Address Translation Simulator is a web-based educational tool for simulating and visualizing Network Address Translation (NAT). It demonstrates how private IP addresses are translated to public IP addresses across a simulated network.

## Tech Stack
*   **Frontend:** React, Vite, TypeScript, Tailwind CSS, React Flow, Framer Motion, Zustand.
*   **Backend:** Node.js, Express.js, TypeScript, Socket.IO.
*   **Database:** MongoDB, Mongoose (optional for local/offline usage, fallback to in-memory store).

## Project Structure
```text
nat-address-translation-simulator/
├── client/          # React frontend
├── server/          # Node.js backend
├── shared/          # Shared TypeScript types and constants
├── docs/            # Project documentation
└── docker-compose.yml
```

## Backend Services
1.  **DeviceService:** Manages simulated network devices (PCs, Routers, Servers).
2.  **PacketService:** Generates, routes, and processes network packets.
3.  **NatEngine:** Core NAT logic handling translation mappings.
    *   **StaticNatService:** 1:1 fixed mapping.
    *   **DynamicNatService:** Pool-based public IP allocation.
    *   **PatService (NAT Overload):** Port-based multiplexing mapping.
4.  **PortManager:** Tracks and allocates ports for PAT and local servers.
5.  **ExpirationService:** Handles NAT mapping TTL (Time-To-Live).
6.  **SimulationService:** Controls simulation state (latency, drops, resets).

## NAT Mapping Models
A mapping entry contains:
*   `protocol`: TCP, UDP, ICMP
*   `insideLocalIP`: Private IP of the host
*   `insideLocalPort`: Source port of the host
*   `insideGlobalIP`: Public IP allocated by NAT
*   `insideGlobalPort`: Public port allocated by NAT
*   `outsideGlobalIP`: Destination public IP
*   `outsideGlobalPort`: Destination public port
*   `state`: e.g., ESTABLISHED
*   `ttl`: Time-to-live countdown

## Real-time Communication
Socket.IO is used to emit state changes to the frontend:
*   `packet:created`, `packet:processing`, `packet:translated`, `packet:forwarded`
*   `nat:mapping-created`, `nat:mapping-expired`
*   `stats:updated`
