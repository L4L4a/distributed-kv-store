<div align="center">

<img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Filing-Cabinet.png" alt="Cabinet" width="80" />

# Distributed Key-Value Store

**Distributed key-value store with consistent hashing, replication, and fault tolerance — data stays readable when nodes go down.**

[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)

</div>

---

## What is this?

A distributed key-value store built from scratch — the same architecture that powers Redis, DynamoDB, and Cassandra.

Data is partitioned across multiple nodes using consistent hashing and replicated across N nodes for fault tolerance. When a node goes down, reads automatically fall back to replicas — zero data loss, zero downtime.

---

## Features

- 🔵 **Consistent hashing** — keys distributed evenly using a hash ring with virtual nodes
- 📋 **Replication** — each key written to N nodes (configurable replication factor)
- 💀 **Fault tolerance** — reads fall back to replicas when primary node is down
- 🔄 **Node management** — simulate node failures and revivals via API
- 📊 **Cluster stats** — live view of node health, key count, and replication status
- ⚡ **O(log N) lookups** — binary search on sorted ring for fast node resolution

---

## Tech Stack

| Layer | Technology |
|---|---|
| Language | TypeScript |
| Server | Node.js, Express |
| Hashing | MD5 via Node.js crypto |
| Storage | In-memory per node |

---

## Architecture

```
Client Request
      │
      ▼
Hash Ring (consistent hashing)
      │
      ▼
Primary Node + Replica Nodes
(replication factor = 2)
      │
   ┌──┴──┐
   │     │
Primary  Replica
alive    fallback
   │     │
   └──┬──┘
      ▼
Return value
```

Keys are placed on a circular hash ring. Each physical node occupies 150 virtual positions on the ring for even distribution. When reading, the primary node is tried first — if it's down, replicas serve the request automatically.

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Cluster health and stats |
| POST | `/keys` | Set a key-value pair |
| GET | `/keys/:key` | Get a value by key |
| DELETE | `/keys/:key` | Delete a key |
| GET | `/nodes` | List all nodes and their keys |
| POST | `/nodes/:id/kill` | Simulate node failure |
| POST | `/nodes/:id/revive` | Bring a node back up |

---

## Getting Started

```bash
git clone https://github.com/L4L4a/distributed-kv-store.git
cd distributed-kv-store
npm install
```

Create a `.env` file:
```env
PORT=3001
NUM_NODES=3
REPLICATION_FACTOR=2
```

```bash
npm run dev
```

**Set a key:**
```bash
curl -X POST http://localhost:3001/keys \
  -H "Content-Type: application/json" \
  -d '{"key": "user:1", "value": "elvis"}'
```

**Kill a node and verify data still readable:**
```bash
curl -X POST http://localhost:3001/nodes/:id/kill
curl http://localhost:3001/keys/user:1  # still works via replica
```

---

<div align="center">

Built by [Elvis Kenneth](https://github.com/L4L4a)

</div>