export interface Node {
  productId: string;
  x: number | null;
  y: number | null;
}

export interface Edge {
  source: string;
  target: string;
}

export interface NodesEdgesData {
  nodes: Node[];
  edges: Edge[];
}

export interface ProductSector {
  productId: string;
}

export interface ProductMetadataItem {
  productId: string;
  productName: string;
  productCode: string;
  productSector?: ProductSector;
}

export interface Metadata {
  productHs92: ProductMetadataItem[];
}
