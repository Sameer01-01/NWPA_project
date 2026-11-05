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
import { useSimulationStore, type DeviceType } from '../store/useSimulationStore';
import { useThemeStore } from '../store/useThemeStore';
import { Monitor, Server, Router, Globe, Smartphone, Tv, Trash2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CustomDeviceNodeData {
  id: string;
  name: string;
  ip: string;
  mac: string;
  type: DeviceType;
  isSelected: boolean;
  canDelete: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

// Custom Node for ReactFlow
const DeviceNode = ({ data }: NodeProps) => {
  const nodeData = data as unknown as CustomDeviceNodeData;
  const isRouter = nodeData.type === 'NAT_ROUTER';
  const isInternet = nodeData.type === 'INTERNET';
  const isSelected = nodeData.isSelected;

  const getDeviceIcon = () => {
    switch (nodeData.type) {
      case 'NAT_ROUTER':
        return <Router className="w-5 h-5" />;
      case 'INTERNET':
        return <Globe className="w-5 h-5" />;
      case 'HOST':
        return <Monitor className="w-5 h-5" />;
      case 'SMARTPHONE':
        return <Smartphone className="w-5 h-5" />;
      case 'IOT':
        return <Tv className="w-5 h-5" />;
      case 'SERVER':
        return <Server className="w-5 h-5" />;
      default:
        return <Monitor className="w-5 h-5" />;
    }
  };

  const getTypeBadge = () => {
    switch (nodeData.type) {
      case 'NAT_ROUTER':
        return { label: 'GATEWAY', color: 'bg-indigo-500/15 text-indigo-500 dark:text-indigo-400 border-indigo-500/30' };
      case 'INTERNET':
        return { label: 'WAN', color: 'bg-cyan-500/15 text-cyan-500 dark:text-cyan-400 border-cyan-500/30' };
      case 'SMARTPHONE':
        return { label: 'PHONE', color: 'bg-amber-500/15 text-amber-500 dark:text-amber-400 border-amber-500/30' };
      case 'IOT':
        return { label: 'IOT', color: 'bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 border-emerald-500/30' };
      case 'SERVER':
        return { label: 'DMZ SERVER', color: 'bg-purple-500/15 text-purple-500 dark:text-purple-400 border-purple-500/30' };
      default:
        return { label: 'LAN HOST', color: 'bg-blue-500/15 text-blue-500 dark:text-blue-400 border-blue-500/30' };
    }
  };

  const badge = getTypeBadge();

  return (
    <div 
      onClick={() => {
        if (!isRouter && !isInternet && nodeData.onSelect) {
          nodeData.onSelect(nodeData.id);
        }
      }}
      className={`relative px-4 py-3 rounded-2xl border transition-all duration-200 select-none cursor-pointer bg-surface/90 backdrop-blur-md min-w-[190px] shadow-lg group ${
        isSelected
          ? 'border-primary ring-2 ring-primary/40 shadow-glow-primary scale-105'
          : isRouter 
            ? 'border-indigo-500/60 shadow-indigo-500/10'
            : isInternet
              ? 'border-cyan-500/60 shadow-cyan-500/10'
              : 'border-border hover:border-primary/50 hover:shadow-md'
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.color}`}>
          {badge.label}
        </span>
        
        {isSelected && (
          <span className="flex items-center gap-1 text-[10px] font-semibold text-primary">
            <CheckCircle2 className="w-3 h-3" /> Active
          </span>
        )}

        {nodeData.canDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              nodeData.onDelete(nodeData.id);
            }}
            className="opacity-0 group-hover:opacity-100 p-1 text-textMuted hover:text-rose-500 transition-opacity"
            title="Delete Device"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2.5">
        <div className={`p-2 rounded-xl shrink-0 ${
          isRouter 
            ? 'bg-indigo-500/20 text-indigo-500 dark:text-indigo-400' 
            : isInternet 
              ? 'bg-cyan-500/20 text-cyan-500 dark:text-cyan-400' 
              : 'bg-black/5 dark:bg-white/10 text-text'
        }`}>
          {getDeviceIcon()}
        </div>

        <div className="min-w-0 flex-1">
          <div className="font-bold text-xs text-text truncate">
            {nodeData.name}
          </div>
          <div className="text-[11px] font-mono text-textMuted mt-0.5 truncate">
            {nodeData.ip}
          </div>
        </div>
      </div>

      {/* Router details (WAN info) */}
      {isRouter && (
        <div className="mt-2 pt-2 border-t border-border flex justify-between text-[10px] font-mono text-textMuted">
          <span>LAN: 192.168.1.1</span>
          <span className="text-primary font-semibold">WAN: 203.0.113.5</span>
        </div>
      )}

      {/* Handles */}
      {!isRouter && !isInternet && (
        <Handle 
          type="source" 
          position={Position.Right} 
          className="!w-2.5 !h-2.5 !bg-primary !border-2 !border-surface" 
        />
      )}

      {isInternet && (
        <Handle 
          type="target" 
          position={Position.Left} 
          className="!w-2.5 !h-2.5 !bg-secondary !border-2 !border-surface" 
        />
      )}

      {isRouter && (
        <>
          <Handle 
            type="target" 
            position={Position.Left} 
            id="lan" 
            className="!w-2.5 !h-2.5 !bg-indigo-500 !border-2 !border-surface" 
          />
          <Handle 
            type="source" 
            position={Position.Right} 
            id="wan" 
            className="!w-2.5 !h-2.5 !bg-cyan-400 !border-2 !border-surface" 
          />
        </>
      )}
    </div>
  );
};

const nodeTypes = {
  device: DeviceNode,
};

export function NetworkTopology() {
  const { devices, packets, selectedHostId, setSelectedHostId, deleteDevice } = useSimulationStore();
  const { theme } = useThemeStore();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  useEffect(() => {
    const lanDevices = devices.filter(d => d.type !== 'NAT_ROUTER' && d.type !== 'INTERNET');
    const router = devices.find(d => d.type === 'NAT_ROUTER');
    const internet = devices.find(d => d.type === 'INTERNET');

    const totalLan = lanDevices.length;
    const yStart = 50;
    const yStep = totalLan > 1 ? Math.min(95, Math.max(68, 380 / (totalLan - 1))) : 100;
    const routerY = totalLan > 0 ? yStart + ((totalLan - 1) * yStep) / 2 : 200;

    const newNodes: Node[] = [];

    // 1. LAN Devices
    lanDevices.forEach((device, index) => {
      newNodes.push({
        id: device.id,
        type: 'device',
        position: { x: 80, y: yStart + index * yStep },
        data: {
          id: device.id,
          name: device.name,
          ip: device.privateIP,
          mac: device.macAddress,
          type: device.type,
          isSelected: selectedHostId === device.id,
          canDelete: lanDevices.length > 1,
          onSelect: setSelectedHostId,
          onDelete: deleteDevice,
        }
      });
    });

    // 2. NAT Router
    if (router) {
      newNodes.push({
        id: router.id,
        type: 'device',
        position: { x: 440, y: routerY },
        data: {
          id: router.id,
          name: router.name,
          ip: router.privateIP,
          mac: router.macAddress,
          type: router.type,
          isSelected: false,
          canDelete: false,
          onSelect: () => {},
          onDelete: () => {},
        }
      });
    }

    // 3. Internet Node
    if (internet) {
      newNodes.push({
        id: internet.id,
        type: 'device',
        position: { x: 780, y: routerY },
        data: {
          id: internet.id,
          name: internet.name,
          ip: internet.publicIP || internet.privateIP,
          mac: internet.macAddress,
          type: internet.type,
          isSelected: false,
          canDelete: false,
          onSelect: () => {},
          onDelete: () => {},
        }
      });
    }

    setNodes(newNodes);

    // Edges
    const strokeColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.2)';
    const newEdges: Edge[] = [];

    if (router) {
      lanDevices.forEach(host => {
        const isHostActive = selectedHostId === host.id;
        newEdges.push({
          id: `e-${host.id}-${router.id}`,
          source: host.id,
          target: router.id,
          targetHandle: 'lan',
          animated: true,
          style: { 
            stroke: isHostActive ? '#6366f1' : strokeColor, 
            strokeWidth: isHostActive ? 2.5 : 1.5 
          }
        });
      });

      if (internet) {
        newEdges.push({
          id: `e-${router.id}-${internet.id}`,
          source: router.id,
          sourceHandle: 'wan',
          target: internet.id,
          animated: true,
          style: { stroke: '#06b6d4', strokeWidth: 2 }
        });
      }
    }

    setEdges(newEdges);
  }, [devices, theme, selectedHostId, setSelectedHostId, deleteDevice, setNodes, setEdges]);

  return (
    <div className="w-full h-full bg-background transition-colors duration-200 relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        attributionPosition="bottom-right"
        proOptions={{ hideAttribution: true }}
      >
        <Background color={theme === 'dark' ? '#222222' : '#cbd5e1'} gap={16} />
        <Controls className="bg-surface border border-border fill-current text-text rounded-xl shadow-lg" />

        {/* Animated Flying Packets */}
        <AnimatePresence>
          {packets.filter(p => p.status !== 'DELIVERED' && p.status !== 'DROPPED').map((packet) => {
            let sourcePos = { x: 0, y: 0 };
            let destPos = { x: 0, y: 0 };

            const hostNode = nodes.find(n => (n.data as unknown as CustomDeviceNodeData).ip === packet.sourceIP);
            const routerNode = nodes.find(n => (n.data as unknown as CustomDeviceNodeData).type === 'NAT_ROUTER');
            const internetNode = nodes.find(n => (n.data as unknown as CustomDeviceNodeData).type === 'INTERNET');

            if (packet.direction === 'OUTBOUND') {
              if (packet.status === 'CREATED' || packet.status === 'PROCESSING') {
                if (hostNode && routerNode) {
                  sourcePos = { x: hostNode.position.x + 190, y: hostNode.position.y + 35 };
                  destPos = { x: routerNode.position.x - 10, y: routerNode.position.y + 35 };
                }
              } else if (packet.status === 'TRANSLATED' || packet.status === 'FORWARDED') {
                if (routerNode && internetNode) {
                  sourcePos = { x: routerNode.position.x + 190, y: routerNode.position.y + 35 };
                  destPos = { x: internetNode.position.x - 10, y: internetNode.position.y + 35 };
                }
              }
            } else {
              // INBOUND
              const destHostNode = nodes.find(n => (n.data as unknown as CustomDeviceNodeData).ip === packet.destinationIP);
              if (packet.status === 'CREATED' || packet.status === 'PROCESSING') {
                if (routerNode && internetNode) {
                  sourcePos = { x: internetNode.position.x - 10, y: internetNode.position.y + 35 };
                  destPos = { x: routerNode.position.x + 190, y: routerNode.position.y + 35 };
                }
              } else if (packet.status === 'TRANSLATED' || packet.status === 'FORWARDED') {
                if (destHostNode && routerNode) {
                  sourcePos = { x: routerNode.position.x - 10, y: routerNode.position.y + 35 };
                  destPos = { x: destHostNode.position.x + 190, y: destHostNode.position.y + 35 };
                }
              }
            }

            if (sourcePos.x === 0 && sourcePos.y === 0) return null;

            return (
              <motion.div
                key={`${packet.id}-${packet.status}`}
                initial={{ x: sourcePos.x, y: sourcePos.y, opacity: 0, scale: 0.6 }}
                animate={{ x: destPos.x, y: destPos.y, opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ duration: 1.2, ease: "easeInOut" }}
                className="absolute z-50 px-2.5 py-1 bg-gradient-to-r from-indigo-500 to-cyan-400 text-white text-[11px] font-bold font-mono rounded-full shadow-lg border border-white/20 whitespace-nowrap pointer-events-none"
              >
                {packet.protocol} {packet.direction === 'OUTBOUND' ? '->' : '<-'}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </ReactFlow>
    </div>
  );
}