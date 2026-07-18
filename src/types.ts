export interface KVNode {
  id: string;
  name: string;
  data: Map<string, string>;
  isAlive: boolean;
  createdAt: string;
}

export interface KVEntry {
  key: string;
  value: string;
  nodes: string[]; // which nodes hold this key
  createdAt: string;
  updatedAt: string;
}

export interface ClusterStats {
  totalNodes: number;
  aliveNodes: number;
  totalKeys: number;
  replicationFactor: number;
}