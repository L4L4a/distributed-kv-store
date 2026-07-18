import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { KVCluster } from './node';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const cluster = new KVCluster();

app.get('/health', (req, res) => {
  res.json({ status: 'ok', ...cluster.getStats() });
});

// set a key
app.post('/keys', (req, res) => {
  const { key, value } = req.body;
  if (!key || value === undefined) {
    res.status(400).json({ error: 'key and value are required' });
    return;
  }

  try {
    const entry = cluster.set(key, value);
    res.status(201).json(entry);
  } catch (err: any) {
    res.status(503).json({ error: err.message });
  }
});

// get a key
app.get('/keys/:key', (req, res) => {
  const entry = cluster.get(req.params.key);
  if (!entry) {
    res.status(404).json({ error: 'key not found' });
    return;
  }
  res.json(entry);
});

// delete a key
app.delete('/keys/:key', (req, res) => {
  const deleted = cluster.delete(req.params.key);
  if (!deleted) {
    res.status(404).json({ error: 'key not found' });
    return;
  }
  res.json({ message: `deleted ${req.params.key}` });
});

// get cluster info and all nodes
app.get('/nodes', (req, res) => {
  const nodes = cluster.getNodes().map(node => ({
    id: node.id,
    name: node.name,
    isAlive: node.isAlive,
    keys: Array.from(node.data.keys()),
    keyCount: node.data.size,
    createdAt: node.createdAt,
  }));
  res.json(nodes);
});

// simulate a node failure
app.post('/nodes/:id/kill', (req, res) => {
  const success = cluster.killNode(req.params.id);
  if (!success) {
    res.status(404).json({ error: 'node not found' });
    return;
  }
  res.json({ message: 'node killed', stats: cluster.getStats() });
});

// bring a node back up
app.post('/nodes/:id/revive', (req, res) => {
  const success = cluster.reviveNode(req.params.id);
  if (!success) {
    res.status(404).json({ error: 'node not found' });
    return;
  }
  res.json({ message: 'node revived', stats: cluster.getStats() });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`distributed kv store running on port ${PORT}`);
});