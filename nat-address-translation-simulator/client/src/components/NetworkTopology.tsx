import { useEffect } from 'react';
import { 
  ReactFlow, 
  Background, 
  Controls,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  type NodeProps,
  type Node,
  type Edge
} from '@xyflow/react';
import { useSimulationStore } from '../store/useSimulationStore';
import { Monitor, Server, Router, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DeviceData {
  name: string;
  ip: string;
  type: string;
}

// Custom Nodes
const DeviceNode = ({ data }: NodeProps) => {
  const nodeData = data as unknown as DeviceData;
  const isRouter = nodeData.type === 'NAT_ROUTER';
  const isInternet = nodeData.type === 'INTERNET';
  const isHost = nodeData.type === 'HOST';

  return (
    <div className={`px-4 py-2 shadow-xl rounded-xl border-2 flex items-center gap-3 bg-surface text-white
      ${isRouter ? 'border-primary' : isInternet ? 'border-secondary' : 'border-white/20'}`}>
      <div className={`p-2 rounded-lg ${isRouter ? 'bg-primary/20 text-primary' : isInternet ? 'bg-secondary/20 text-secondary' : 'bg-white/10'}`}>
        {isRouter && <Router size={24} />}
        {isInternet && <Globe size={24} />}
        {isHost && <Monitor size={24} />}
        {!isRouter && !isInternet && !isHost && <Server size={24} />}
      </div>
      <div>
        <div className="font-bold text-sm">{nodeData.name}</div>
        <div className="text-xs text-textMuted font-mono mt-0.5">{nodeData.ip}</div>
      </div>
      
      {/* Handles based on type */}
      {isHost && <Handle type="source" position={Position.Right} />}
      {isInternet && <Handle type="target" position={Position.Left} />}
      {isRouter && (
        <>
          <Handle type="target" position={Position.Left} id="lan" />
          <Handle type="source" position={Position.Right} id="wan" />
        </>
      )}
    </div>
  );
};

const nodeTypes = {
  device: DeviceNode,
};

export function NetworkTopology() {
  const { devices, packets } = useSimulationStore();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  useEffect(() => {
    // Generate nodes based on devices
    const newNodes = devices.map((device, index) => {
      let x = 0;
      let y = 0;
      
      if (device.type === 'HOST') {
        x = 100;
        y = 100 + index * 100;
      } else if (device.type === 'NAT_ROUTER') {
        x = 450;
        y = 200;
      } else if (device.type === 'INTERNET') {
        x = 800;
        y = 200;
      }

      return {
        id: device.id,
        type: 'device',
        position: { x, y },
        data: { 
          name: device.name, 
          ip: device.privateIP,
          type: device.type
        }
      };
    });

    setNodes(newNodes);

    // Generate edges connecting hosts to router, and router to internet
    const newEdges = [];
    const router = devices.find(d => d.type === 'NAT_ROUTER');
    const internet = devices.find(d => d.type === 'INTERNET');

    if (router) {
      devices.filter(d => d.type === 'HOST').forEach(host => {
        newEdges.push({
          id: `e-${host.id}-${router.id}`,
          source: host.id,
          target: router.id,
          targetHandle: 'lan',
          animated: true,
          style: { stroke: 'rgba(255,255,255,0.2)', strokeWidth: 2 }
        });
      });

      if (internet) {
        newEdges.push({
          id: `e-${router.id}-${internet.id}`,
          source: router.id,
          sourceHandle: 'wan',
          target: internet.id,
          animated: true,
          style: { stroke: 'rgba(255,255,255,0.2)', strokeWidth: 2 }
        });
      }
    }
    
    setEdges(newEdges);
  }, [devices]);

  return (
    <div className="w-full h-full bg-[#0b1120]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        attributionPosition="bottom-right"
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#1e293b" gap={16} />
        <Controls className="bg-surface border border-white/10 fill-white" />
        
        {/* Packet Animations */}
        <AnimatePresence>
          {packets.filter(p => p.status !== 'DELIVERED' && p.status !== 'DROPPED').map((packet) => {
            // Find positions
            let sourcePos = { x: 0, y: 0 };
            let destPos = { x: 0, y: 0 };
            
            if (packet.direction === 'OUTBOUND') {
              const hostNode = nodes.find(n => n.data.ip === packet.sourceIP);
              const routerNode = nodes.find(n => n.data.type === 'NAT_ROUTER');
              const internetNode = nodes.find(n => n.data.type === 'INTERNET');
              
              if (packet.status === 'CREATED' || packet.status === 'PROCESSING') {
                if (hostNode && routerNode) {
                  sourcePos = { x: hostNode.position.x + 180, y: hostNode.position.y + 40 };
                  destPos = { x: routerNode.position.x - 20, y: routerNode.position.y + 40 };
                }
              } else if (packet.status === 'TRANSLATED') {
                if (routerNode && internetNode) {
                  sourcePos = { x: routerNode.position.x + 180, y: routerNode.position.y + 40 };
                  destPos = { x: internetNode.position.x - 20, y: internetNode.position.y + 40 };
                }
              }
            } else {
              // INBOUND
              const hostNode = nodes.find(n => n.data.ip === packet.destinationIP);
              const routerNode = nodes.find(n => n.data.type === 'NAT_ROUTER');
              const internetNode = nodes.find(n => n.data.type === 'INTERNET');

              if (packet.status === 'CREATED' || packet.status === 'PROCESSING') {
                 if (routerNode && internetNode) {
                  sourcePos = { x: internetNode.position.x - 20, y: internetNode.position.y + 40 };
                  destPos = { x: routerNode.position.x + 180, y: routerNode.position.y + 40 };
                }
              } else if (packet.status === 'TRANSLATED') {
                 if (hostNode && routerNode) {
                  sourcePos = { x: routerNode.position.x - 20, y: routerNode.position.y + 40 };
                  destPos = { x: hostNode.position.x + 180, y: hostNode.position.y + 40 };
                }
              }
            }

            if (sourcePos.x === 0 && sourcePos.y === 0) return null;

            return (
              <motion.div
                key={`${packet.id}-${packet.status}`}
                initial={{ x: sourcePos.x, y: sourcePos.y, opacity: 0, scale: 0.5 }}
                animate={{ x: destPos.x, y: destPos.y, opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ duration: 1.5, ease: "linear" }}
                className="absolute z-50 px-3 py-1 bg-primary text-white text-xs font-bold rounded-full shadow-lg border border-white/20 whitespace-nowrap"
              >
                {packet.protocol}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </ReactFlow>
    </div>
  );
}
