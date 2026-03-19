import React, { useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Handle,
  Position,
  NodeProps,
  Edge,
  Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { cn } from '../lib/utils';
import { Activity, Wind, ThermometerSun, Building, Leaf, Droplets, Zap, AlertTriangle } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import dagre from 'dagre';

const CustomNode = ({ data, targetPosition = Position.Left, sourcePosition = Position.Right, selected }: NodeProps) => {
  const Icon = data.icon as React.ElementType;
  return (
    <div className={cn(
      "px-5 py-4 rounded-2xl backdrop-blur-xl border transition-all duration-300 min-w-[240px] flex items-center gap-4",
      selected ? "border-primary ring-2 ring-primary/20 scale-[1.02]" : "border-white/20 dark:border-zinc-800/50 shadow-lg",
      data.color || "bg-white/80 dark:bg-zinc-900/80"
    )}>
      <Handle type="target" position={targetPosition} className="w-2 h-2 !bg-primary border-none" />
      
      <div className={cn(
        "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
        data.iconBg || "bg-primary/10 text-primary"
      )}>
        <Icon className="w-6 h-6" />
      </div>
      
      <div className="flex-1">
        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">{data.category}</div>
        <div className="text-sm font-bold tracking-tight">{data.label}</div>
        {selected && data.description && (
          <div className="mt-1 text-[10px] font-medium leading-tight opacity-70 animate-in fade-in duration-300">
            {data.description}
          </div>
        )}
      </div>

      <Handle type="source" position={sourcePosition} className="w-2 h-2 !bg-primary border-none" />
    </div>
  );
};

const nodeTypes = {
  custom: CustomNode,
};

const initialNodes: Node[] = [
  { id: '1', type: 'custom', position: { x: 0, y: 0 }, data: { label: 'Urbanization', category: 'Driver', icon: Building, color: 'bg-slate-500/20 dark:bg-slate-500/30', iconBg: 'bg-slate-500/30 text-slate-500', description: 'Replacement of natural surfaces with concrete and asphalt.' } },
  { id: '2', type: 'custom', position: { x: 0, y: 0 }, data: { label: 'Tree Cover', category: 'Mitigator', icon: Leaf, color: 'bg-emerald-500/20 dark:bg-emerald-500/30', iconBg: 'bg-emerald-500/30 text-emerald-500', description: 'Urban forests and green spaces that provide shade.' } },
  { id: '3', type: 'custom', position: { x: 0, y: 0 }, data: { label: 'Temperature', category: 'Climate', icon: ThermometerSun, color: 'bg-orange-500/20 dark:bg-orange-500/30', iconBg: 'bg-orange-500/30 text-orange-500', description: 'Ambient air temperature in the shade.' } },
  { id: '4', type: 'custom', position: { x: 0, y: 0 }, data: { label: 'Humidity', category: 'Climate', icon: Droplets, color: 'bg-blue-500/20 dark:bg-blue-500/30', iconBg: 'bg-blue-500/30 text-blue-500', description: 'Amount of water vapor in the air.' } },
  { id: '5', type: 'custom', position: { x: 0, y: 0 }, data: { label: 'Wind Speed', category: 'Climate', icon: Wind, color: 'bg-cyan-500/20 dark:bg-cyan-500/30', iconBg: 'bg-cyan-500/30 text-cyan-500', description: 'Air movement that disperses heat.' } },
  { id: '6', type: 'custom', position: { x: 0, y: 0 }, data: { label: 'Generator Use', category: 'Driver', icon: Zap, color: 'bg-yellow-500/20 dark:bg-yellow-500/30', iconBg: 'bg-yellow-500/30 text-yellow-500', description: 'Local emissions from backup power.' } },
  { id: '7', type: 'custom', position: { x: 0, y: 0 }, data: { label: 'Heat Index', category: 'Impact', icon: Activity, color: 'bg-red-500/20 dark:bg-red-500/30', iconBg: 'bg-red-500/30 text-red-500', description: 'Real feel temperature for humans.' } },
  { id: '8', type: 'custom', position: { x: 0, y: 0 }, data: { label: 'Air Quality (AQI)', category: 'Impact', icon: AlertTriangle, color: 'bg-purple-500/20 dark:bg-purple-500/30', iconBg: 'bg-purple-500/30 text-purple-500', description: 'Health measure of air pollutants.' } },
];

const redEdgeProps = {
  type: 'smoothstep',
  animated: true,
  style: { stroke: '#ef4444', strokeWidth: 2 },
  labelStyle: { fill: '#ffffff', fontWeight: 700, fontSize: 10, letterSpacing: 0.5 },
  labelBgStyle: { fill: 'rgba(239, 68, 68, 0.85)', stroke: 'none' },
  labelBgPadding: [12, 6] as [number, number],
  labelBgBorderRadius: 12,
};

const greenEdgeProps = {
  type: 'smoothstep',
  animated: true,
  style: { stroke: '#10b981', strokeWidth: 2 },
  labelStyle: { fill: '#ffffff', fontWeight: 700, fontSize: 10, letterSpacing: 0.5 },
  labelBgStyle: { fill: 'rgba(16, 185, 129, 0.85)', stroke: 'none' },
  labelBgPadding: [12, 6] as [number, number],
  labelBgBorderRadius: 12,
};

const initialEdges: Edge[] = [
  { id: 'e1-7', source: '1', target: '7', label: 'Increases', ...redEdgeProps },
  { id: 'e2-7', source: '2', target: '7', label: 'Decreases', ...greenEdgeProps },
  { id: 'e3-7', source: '3', target: '7', label: 'Increases', ...redEdgeProps },
  { id: 'e4-7', source: '4', target: '7', label: 'Increases', ...redEdgeProps },
  { id: 'e5-7', source: '5', target: '7', label: 'Decreases', ...greenEdgeProps },
  { id: 'e1-6', source: '1', target: '6', label: 'Increases', ...redEdgeProps },
  { id: 'e6-8', source: '6', target: '8', label: 'Worsens', ...redEdgeProps },
  { id: 'e5-8', source: '5', target: '8', label: 'Improves', ...greenEdgeProps },
  { id: 'e3-8', source: '3', target: '8', label: 'Traps Pollution', ...redEdgeProps },
];

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'LR') => {
  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({ rankdir: direction, ranksep: 180, nodesep: 100 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 240, height: 80 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const targetPosition = isHorizontal ? Position.Left : Position.Top;
    const sourcePosition = isHorizontal ? Position.Right : Position.Bottom;

    return {
      ...node,
      targetPosition,
      sourcePosition,
      position: {
        x: nodeWithPosition.x - 220 / 2,
        y: nodeWithPosition.y - 80 / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

export default function SystemsMap() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { theme } = useTheme();

  // Determine actual theme if 'auto' is selected
  const isDark = theme === 'dark' || (theme === 'auto' && (new Date().getHours() < 7 || new Date().getHours() >= 19));

  useEffect(() => {
    const updateLayout = () => {
      // Use Top-to-Bottom on mobile, Left-to-Right on desktop
      const direction = window.innerWidth < 768 ? 'TB' : 'LR';
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
        initialNodes,
        initialEdges,
        direction
      );
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
    };

    updateLayout();
    window.addEventListener('resize', updateLayout);
    return () => window.removeEventListener('resize', updateLayout);
  }, [setNodes, setEdges]);

  const onConnect = useCallback(
    (params: any) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  return (
    <div className="w-full h-[600px] rounded-[32px] overflow-hidden border border-white/60 dark:border-zinc-800/50 bg-white/20 dark:bg-zinc-900/20 backdrop-blur-2xl shadow-sm">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        colorMode={isDark ? 'dark' : 'light'}
        proOptions={{ hideAttribution: true }}
        className="bg-transparent [&_.react-flow__attribution]:hidden"
      >
        <Background color="#888" gap={16} size={1} />
        <Controls className="custom-flow-controls" />
      </ReactFlow>
    </div>
  );
}
