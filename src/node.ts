import { v4 as uuidv4 } from 'uuid';
import { KVNode, KVEntry, ClusterStats } from './types';
import { HashRing } from './ring';
import dotenv from 'dotenv';

dotenv.config();

const REPLICATION_FACTOR = parseInt(process.env.REPLICATION_FACTOR || '2');
const NUM_NODES = parseInt(process.env.NUM_NODES || '3');

export class KVCluster {
  private ring: HashRing = new HashRing();
  private entries: Map<string, KVEntry> = new Map();

  constructor() {
    // spin up the initial nodes
    for (let i = 0; i < NUM_NODES; i++) {
      const node: KVNode = {
        id: uuidv4(),
        name: `node-${i + 1}`,
        data: new Map(),
        isAlive: true,
        createdAt: new Date().toISOString(),
      };
      this.ring.addNode(node);
      console.log(`started ${node.name}`);
    }
  }

  set(key: string, value: string): KVEntry {
    // find which nodes should hold this key
    const replicas = this.ring.getReplicaNodes(key, REPLICATION_FACTOR);

    if (replicas.length === 0) {
      throw new Error('no alive nodes available');
    }

    // write to all replica nodes
    for (const node of replicas) {
      node.data.set(key, value);
    }

    const entry: KVEntry = {
      key,
      value,
      nodes: replicas.map(n => n.name),
      createdAt: this.entries.get(key)?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.entries.set(key, entry);
    console.log(`set "${key}" on nodes: ${entry.nodes.join(', ')}`);
    return entry;
  }

  get(key: string): KVEntry | null {
    const entry = this.entries.get(key);
    if (!entry) return null;

    // try to read from the primary node first
    const primaryNode = this.ring.getNode(key);
    if (primaryNode?.data.has(key)) {
      return entry;
    }

    // fall back to replicas if primary is down
    const replicas = this.ring.getReplicaNodes(key, REPLICATION_FACTOR);
    for (const node of replicas) {
      if (node.data.has(key)) {
        console.log(`read "${key}" from replica ${node.name} (primary unavailable)`);
        return entry;
      }
    }

    return null;
  }

  delete(key: string): boolean {
    if (!this.entries.has(key)) return false;

    // remove from all nodes that have it
    const replicas = this.ring.getReplicaNodes(key, REPLICATION_FACTOR);
    for (const node of replicas) {
      node.data.delete(key);
    }

    this.entries.delete(key);
    console.log(`deleted "${key}"`);
    return true;
  }

  // simulate a node going down
  killNode(nodeId: string): boolean {
    const node = this.ring.getNodeById(nodeId);
    if (!node) return false;

    node.isAlive = false;
    console.log(`${node.name} went down`);
    return true;
  }

  // bring a node back up and re-replicate its data
  reviveNode(nodeId: string): boolean {
    const node = this.ring.getNodeById(nodeId);
    if (!node) return false;

    node.isAlive = true;
    console.log(`${node.name} came back up`);
    return true;
  }

  getStats(): ClusterStats {
    const allNodes = this.ring.getAllNodes();
    return {
      totalNodes: allNodes.length,
      aliveNodes: allNodes.filter(n => n.isAlive).length,
      totalKeys: this.entries.size,
      replicationFactor: REPLICATION_FACTOR,
    };
  }

  getNodes(): KVNode[] {
    return this.ring.getAllNodes().map(node => ({
      ...node,
      data: node.data, // keep the Map intact
    }));
  }
}