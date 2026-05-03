export interface ContainerInfo {
  id: string;
  name: string;
  image: string;
  state: string;
  status: string;
  publishedPorts: Array<{
    containerPort: number;
    hostPort: number;
    protocol: string;
  }>;
  webUi: {
    port: number;
    path: string;
  } | null;
}
