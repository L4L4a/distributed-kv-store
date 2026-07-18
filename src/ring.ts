import crypto from 'crypto';
import { KVNode } from './types';

// consistent hashing ring — decides which nodes own which keys
export class HashRing {
  private nodes: Map<string, KVNode> = new Map();
  private ring: { hash: number; nodeId: string }[] = [];
  private virtualNodes = 150; // more virtual nodes = better distribution

  addNode(node: KVNode): void {
    this.nodes.set(node.id, node);

    // each physical node gets multiple points on the ring
    for (let i = 0; i < this.virtualNodes; i++) {
      const hash = this.hash(`${node.id}:${i}`);
      this.ring.push({ hash, nodeId: node.id });
    }

    // keep ring sorted by hash so we can binary search it
    this.ring.sort((a, b) => a.hash - b.hash);
  }

  removeNode(nodeId: string): void {
    this.nodes.delete(nodeId);
    this.ring = this.ring.filter(entry => entry.nodeId !== nodeId);
  }

  // find which node a key belongs to
  getNode(key: string): KVNode | null {
    if (this.ring.length === 0) return null;

    const hash = this.hash(key);

    // walk the ring clockwise until we find a node
    for (const entry of this.ring) {
      if (entry.hash >= hash) {
        const node = this.nodes.get(entry.nodeId);
        if (node?.isAlive) return node;
      }
    }

    // wrap around to the first node if we hit the end
    for (const entry of this.ring) {
      const node = this.nodes.get(entry.nodeId);
      if (node?.isAlive) return node;
    }

    return null;
  }

  // get N nodes for replication — walk the ring picking unique alive nodes
  getReplicaNodes(key: string, count: number): KVNode[] {
    if (this.ring.length === 0) return [];

    const hash = this.hash(key);
    const replicas: KVNode[] = [];
    const seen = new Set<string>();

    const startIdx = this.ring.findIndex(e => e.hash >= hash);
    const startFrom = startIdx === -1 ? 0 : startIdx;

    for (let i = 0; i < this.ring.length && replicas.length < count; i++) {
      const idx = (startFrom + i) % this.ring.length;
      const nodeId = this.ring[idx].nodeId;
      const node = this.nodes.get(nodeId);

      if (node?.isAlive && !seen.has(nodeId)) {
        replicas.push(node);
        seen.add(nodeId);
      }
    }

    return replicas;
  }

  getAllNodes(): KVNode[] {
    return Array.from(this.nodes.values());
  }

  getNodeById(id: string): KVNode | undefined {
    return this.nodes.get(id);
  }

  private hash(key: string): number {
    const hex = crypto.createHash('md5').update(key).digest('hex');
    return parseInt(hex.substring(0, 8), 16);
  }
}