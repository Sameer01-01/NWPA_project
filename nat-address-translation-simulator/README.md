# 🌐 NAT (Network Address Translation) Simulator

> An interactive, full-stack educational simulation platform that visualizes how Network Address Translation (NAT) works under the hood — connecting private local area networks (LAN) to the public Internet (WAN) in real-time.

> 📢 **Presenting this project today?** Check out the step-by-step **[Presentation & Demo Guide (Script, Walkthrough & Q&A)](./PRESENTATION_GUIDE.md)**!

---

## 📑 Table of Contents
1. [Executive Summary (The 30-Second Pitch)](#-executive-summary-the-30-second-pitch)
2. [Why Does NAT Exist? (The Core Problem)](#-why-does-nat-exist-the-core-problem)
3. [Core Networking Concepts & Terminology](#-core-networking-concepts--terminology)
   - [The 4 NAT Address Types](#the-4-nat-address-types)
   - [The 3 NAT Modes Implemented](#the-3-nat-modes-implemented)
   - [How ICMP (Ping) is Translated Without Ports](#how-icmp-ping-is-translated-without-ports)
4. [Step-by-Step: How a Packet Travels (The Complete Lifecycle)](#-step-by-step-how-a-packet-travels-the-complete-lifecycle)
   - [Outbound Flow (LAN Host -> Internet Server)](#1-outbound-flow-lan-host---internet-server)
   - [Inbound Flow (Internet Server -> LAN Host)](#2-inbound-flow-internet-server---lan-host)
   - [Packet Drops & Edge Cases](#3-packet-drops--edge-cases)
5. [System Architecture & Tech Stack](#-system-architecture--tech-stack)
   - [Monorepo Structure](#monorepo-structure)
   - [Frontend Architecture (`/client`)](#frontend-architecture-client)
   - [Backend Simulation Engine (`/server`)](#backend-simulation-engine-server)
   - [Shared Contracts (`/shared`)](#shared-contracts-shared)
6. [Real-Time WebSocket Protocol (Socket.IO Events)](#-real-time-websocket-protocol-socketio-events)
7. [REST API Reference](#-rest-api-reference)
8. [How to Run, Build, and Test](#-how-to-run-build-and-test)
9. [Interview & Presentation Guide (Cheat Sheet & FAQs)](#-interview--presentation-guide-cheat-sheet--faqs)

---

## ⚡ Executive Summary (The 30-Second Pitch)

When you connect multiple computers, smartphones, and IoT devices to your home or office Wi-Fi, every device receives a **private IP address** (e.g., `192.168.1.10`). However, private addresses cannot route across the public Internet. Your router has only **one public IP address** (e.g., `203.0.113.5`) assigned by your ISP.

**This project is a discrete-event network simulator and visualizer** that replicates router-level Network Address Translation. It lets you:
- Inspect an interactive visual topology of hosts, a NAT router, and remote web servers.
- Generate live TCP, UDP, and ICMP network packets.
- Watch animated packets travel across the network.
- Inspect the dynamic NAT translation table, port allocation, and TTL countdowns in real-time.
- Switch between **PAT (NAT Overload)**, **Dynamic NAT**, and **Static NAT**.

---

## ❓ Why Does NAT Exist? (The Core Problem)

1. **IPv4 Address Exhaustion:** IPv4 uses 32-bit addresses, offering approximately 4.29 billion unique addresses. With billions of mobile devices and computers worldwide, the world ran out of free public IPv4 blocks.
2. **RFC 1918 Private Ranges:** To avoid wasting public IPs, three address spaces were reserved strictly for internal private networks:
   - `10.0.0.0/8` (10.0.0.0 – 10.255.255.255)
   - `172.16.0.0/12` (172.16.0.0 – 172.31.255.255)
   - `192.168.0.0/16` (192.168.0.0 – 192.168.255.255)
3. **The Router's Challenge:** Internet routers drop any packet bearing a private source or destination IP. Therefore, an edge router must rewrite the packet headers on the fly as packets leave the LAN and rewrite them back when replies return. This translation process is **NAT**.

---

## 🧠 Core Networking Concepts & Terminology

### The 4 NAT Address Types
Cisco and network standards define four critical terms used in NAT tables:

| Term | Meaning in This Simulator | Example in Simulation |
| :--- | :--- | :--- |
| **Inside Local** | The actual private IP & port configured on the internal host. | `192.168.1.10:5000` |
| **Inside Global** | The router's public WAN IP & public port allocated to represent that host to the Internet. | `203.0.113.5:40000` |
| **Outside Local** | The destination IP of the remote server as viewed from inside the local network. | `8.8.8.8:80` |
| **Outside Global** | The actual public IP of the destination server on the Internet. | `8.8.8.8:80` |

---

### The 3 NAT Modes Implemented

```
                        ┌──────────────────────────────────────────────┐
                        │              NAT ARCHITECTURE                │
                        └──────────────────────┬───────────────────────┘
                                               │
             ┌─────────────────────────────────┼─────────────────────────────────┐
             │                                 │                                 │
             ▼                                 ▼                                 ▼
    ┌─────────────────┐               ┌─────────────────┐               ┌─────────────────┐
    │   STATIC NAT    │               │   DYNAMIC NAT   │               │  PAT (OVERLOAD) │
    │ 1:1 Dedicated   │               │ Pool-Based (M:N)│               │ Port Multiplex  │
    │ Private -> Pub  │               │ Leased on Demand│               │ Many -> One IP  │
    └─────────────────┘               └─────────────────┘               └─────────────────┘
```

#### 1. PAT (Port Address Translation / NAT Overload) — *Default & Most Common*
- **Mechanism:** Multiple private hosts share **a single public IP** (`203.0.113.5`).
- **How it separates hosts:** The router assigns a unique public source port (from `40000` to `50000` via `PortManager`) to each session.
- **Example:**
  - `PC-01` (`192.168.1.10:5000`) -> Translated to `203.0.113.5:40000`
  - `PC-02` (`192.168.1.11:5000`) -> Translated to `203.0.113.5:40001`
  - Both reach `8.8.8.8:80`. When the server replies to port `40000`, the router knows to forward it to `PC-01`.

#### 2. Dynamic NAT
- **Mechanism:** The router maintains a **pool of public IP addresses** (e.g., `203.0.113.10`, `203.0.113.11`, `203.0.113.12`).
- **Allocation:** When an internal host sends a packet, it is leased the first available public IP from the pool.
- **Pool Exhaustion:** If 3 hosts occupy all 3 public IPs and a 4th host attempts to send traffic, the packet is dropped with `NAT_POOL_EXHAUSTED`.

#### 3. Static NAT
- **Mechanism:** A permanent **1-to-1 mapping** between a specific private IP and a specific public IP.
- **Use Case:** Web servers or mail servers located in a private DMZ that need consistent inbound accessibility from the public Internet.

---

### How ICMP (Ping) is Translated Without Ports
TCP and UDP have port numbers (Layer 4), but ICMP is Layer 3 (Network Layer) and has no port numbers!
- **Solution in NatEngine:** The simulator utilizes the **ICMP Echo Request Identifier** as the `sourcePort` equivalent to create and track the session in the NAT table.

---

## 🔄 Step-by-Step: How a Packet Travels (The Complete Lifecycle)

### 1. Outbound Flow (LAN Host -> Internet Server)

```
[ PC-01 (192.168.1.10:5000) ]
              │
              │  1. Packet created (Status: CREATED)
              ▼
[ NAT ROUTER (LAN: 192.168.1.1 | WAN: 203.0.113.5) ]
              │
              ├─ 2. Intercept packet (Status: PROCESSING)
              ├─ 3. Check NAT Table:
              │     - Existing mapping found? Reuse it and refresh TTL.
              │     - No mapping? Allocate port (e.g., 40000) from PortManager.
              │     - Create entry: 192.168.1.10:5000 <-> 203.0.113.5:40000
              ├─ 4. Header Rewrite (Status: TRANSLATED):
              │     - Source IP: 192.168.1.10  -->  203.0.113.5
              │     - Source Port: 5000        -->  40000
              ▼
[ PUBLIC INTERNET SERVER (8.8.8.8:80) ]
              │
              └─ 5. Delivered to destination (Status: DELIVERED)
```

### 2. Inbound Flow (Internet Server -> LAN Host)

```
[ PUBLIC INTERNET SERVER (8.8.8.8:80) ]
              │
              │  Sends reply to: Destination 203.0.113.5:40000
              ▼
[ NAT ROUTER (203.0.113.5) ]
              │
              ├─ 1. Intercept inbound packet
              ├─ 2. Lookup NAT Table by:
              │     Inside Global IP (203.0.113.5) + Port (40000) + Protocol (TCP)
              ├─ 3. Match found!
              │     Target: Inside Local IP (192.168.1.10) + Port (5000)
              ├─ 4. Reverse Header Rewrite:
              │     - Destination IP: 203.0.113.5  -->  192.168.1.10
              │     - Destination Port: 40000       -->  5000
              ▼
[ PC-01 (192.168.1.10:5000) ]
              │
              └─ 5. Packet received by original host!
```

### 3. Packet Drops & Edge Cases
- **Unsolicited Inbound Traffic:** If an external server sends a packet to `203.0.113.5:49999` with no existing entry in the NAT table, the router drops the packet (`NO_TRANSLATION_MAPPING`). This demonstrates how NAT inherently acts as a basic stateful firewall.
- **TTL Expiration:** Every mapping has a Time-To-Live (default 30 seconds). A 1-second server tick decrements the timer. When `diffSeconds > TTL`, the entry is pruned, and the port is returned to `PortManager`.

---

## 🏗️ System Architecture & Tech Stack

### Monorepo Structure
The project is organized as an NPM workspace:
```
nat-address-translation-simulator/
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/     # Visual topology, packet sender, NAT table, logs
│   │   ├── pages/          # Dashboard, Simulator, Settings, Learn
│   │   ├── store/          # Zustand simulation store & Socket.IO client
│   │   └── App.tsx         # Routing & layout navigation
│   └── package.json
├── server/                 # Node.js + Express + Socket.IO backend
│   ├── src/
│   │   ├── services/       # NatEngine, PortManager, DeviceService, SimulationService
│   │   ├── utils/          # ID & IP helper utilities
│   │   └── server.ts       # Express HTTP server & Socket.IO setup
│   └── package.json
├── shared/                 # Shared TypeScript interfaces & types
│   └── src/index.ts        # Packet, Device, NatMapping, Protocol models
├── docs/                   # Architecture documentation
├── docker-compose.yml      # Container orchestration
└── package.json            # Root workspace orchestrator with concurrently
```

### Frontend Architecture (`/client`)
- **React 19 & TypeScript:** Type-safe components with fast Vite compilation.
- **`@xyflow/react` (React Flow):** Renders the visual network topology graph with custom node components representing Hosts, the NAT Router, and Internet Servers.
- **`framer-motion`:** Renders live, animated floating packet badges that visually travel across nodes along network edges as simulation status updates occur.
- **`zustand`:** Central reactive simulation store (`useSimulationStore.ts`). Tracks devices, packets, the NAT table, live event logs, and packet metrics.
- **Tailwind CSS:** Modern dark-mode responsive glassmorphic UI.

### Backend Simulation Engine (`/server`)
- **`NatEngine.ts`:** The core translation algorithm. Evaluates outbound and inbound packets, handles translation lookups, creates table mappings, and executes TTL expiration cleanup.
- **`PortManager.ts`:** Manages port allocation for PAT (range `40000`–`50000`). Checks port availability, allocates unused ports, and frees ports upon mapping expiration.
- **`DeviceService.ts`:** In-memory network topology containing host devices, router interfaces, and public servers with IP and MAC addresses.
- **`SimulationService.ts`:** Orchestrates the lifecycle of packets, dispatches Socket.IO events, introduces simulated latency (500ms–1000ms) to reflect real transmission delays, and runs the TTL expiration clock.

### Shared Contracts (`/shared`)
- Exports unified TypeScript types across client and server:
  - `Protocol`: `"TCP" | "UDP" | "ICMP"`
  - `PacketDirection`: `"OUTBOUND" | "INBOUND"`
  - `PacketStatus`: `"CREATED" | "PROCESSING" | "TRANSLATED" | "FORWARDED" | "RECEIVED" | "DROPPED" | "DELIVERED"`
  - `NatMode`: `"STATIC" | "DYNAMIC" | "PAT"`
  - `NatMapping`: Data structure of a row in the NAT table.

---

## 📡 Real-Time WebSocket Protocol (Socket.IO Events)

Communication between the browser and backend is driven by real-time events over Socket.IO:

| Event Name | Direction | Payload | Description |
| :--- | :--- | :--- | :--- |
| `packet:created` | Server -> Client | `Packet` | Fired when a new packet is generated at a host. |
| `packet:processing` | Server -> Client | `Packet` | Fired when the router receives and inspects the packet. |
| `packet:translated` | Server -> Client | `Packet` | Fired when headers have been translated by the NAT Engine. |
| `packet:delivered` | Server -> Client | `Packet` | Fired when the packet reaches its final destination. |
| `packet:dropped` | Server -> Client | `{ packet, reason }` | Fired when translation fails or pool is exhausted. |
| `nat:table-updated`| Server -> Client | `NatMapping[]` | Dispatched every second on clock ticks and whenever mappings change. |

---

## 🔌 REST API Reference

The server exposes REST endpoints on port `5000`:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/devices` | Returns all simulated devices (PCs, Router, Internet Server). |
| `GET` | `/api/nat/mappings` | Returns all current active rows in the NAT table. |
| `POST`| `/api/packets/send` | Submits a packet to be simulated and translated. |
| `GET` | `/api/config` | Retrieves the router configuration (Mode, WAN IP, IP pool, TTL). |
| `POST`| `/api/config` | Updates the router configuration dynamically. |
| `POST`| `/api/simulation/reset` | Clears all NAT mappings and resets port pools. |

---

## 🚀 How to Run, Build, and Test

### Prerequisites
- **Node.js** (v18 or higher)
- **npm** (v9 or higher)

### 1. Install Dependencies
From the repository root:
```bash
npm run install:all
```

### 2. Start Both Frontend and Backend (One Command)
```bash
npm run dev
```
This runs `concurrently`:
- **Backend API & WebSockets:** `http://localhost:5000`
- **Frontend Vite Client:** `http://localhost:5173`

Open your browser and navigate to **`http://localhost:5173`**.

### 3. Build for Production
To verify TypeScript compilation and bundle production assets:
```bash
npm run build
```

### 4. Run Backend Unit Tests
Unit tests for the NAT Engine are written using Vitest:
```bash
cd server
npx vitest run
```

---

## 🎤 Interview & Presentation Guide (Cheat Sheet & FAQs)

If you are presenting this project to a professor, interviewer, or team, use these questions and answers:

### Q1: "What does this project do in simple terms?"
> *"It is an interactive visual simulator for Network Address Translation. It lets you see what happens inside an edge router when multiple private computers send requests out to the Internet and receive replies back, demonstrating how private IP addresses are dynamically translated into public IP addresses and ports."*

### Q2: "Why do we need NAT in real life?"
> *"Two reasons: IPv4 conservation and security. IPv4 only has ~4.3 billion addresses, which is not enough for every connected device. NAT allows an entire home or corporation to share one public IP. Second, because outside devices cannot reach internal private devices unless an outbound session was established first, NAT provides basic perimeter firewall protection."*

### Q3: "What is the difference between Dynamic NAT and PAT (NAT Overload)?"
> *"Dynamic NAT maps private IPs to a pool of public IPs on a 1-to-1 basis. If you have 3 public IPs, only 3 private computers can access the Internet simultaneously. PAT (Port Address Translation), which is what almost all home routers use, maps many private IPs to a single public IP by changing Layer 4 port numbers."*

### Q4: "What happens if two computers inside the LAN connect to the same website using the same source port?"
> *"This is where PAT shines. If `PC-01` (`192.168.1.10:5000`) and `PC-02` (`192.168.1.11:5000`) both connect to `google.com:443`, the NAT router rewrites `PC-01`'s port to `40000` and `PC-02`'s port to `40001`. When Google replies to port `40000`, the router inspects the NAT table and knows the packet belongs to `PC-01`, not `PC-02`."*

### Q5: "How did you design the system architecture?"
> *"We built it as a TypeScript monorepo with NPM workspaces. The core simulation engine runs on Node.js using an event-driven model. The frontend uses React with React Flow to display the network topology and Framer Motion for packet animations. We use Socket.IO for sub-millisecond bidirectional event delivery so every packet transition and NAT table update is reflected on the UI in real-time."*

---

## 📄 License
This project is developed for educational and academic demonstration purposes.
