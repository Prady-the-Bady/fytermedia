'use client';

import { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Billboard, Html, useTexture } from '@react-three/drei';
import { Vector3 } from 'three';
import { motion } from 'framer-motion';
import { User } from '@prisma/client';
import ReputationScore from '../ui/ReputationScore';

// Define the node data structure
interface ConnectionNode {
  id: string;
  name: string;
  username: string;
  image?: string;
  reputationScore: number;
  status: 'online' | 'away' | 'offline';
  position: [number, number, number];
  connections: string[];
}

// User node component
function UserNode({ node, onClick, selectedId }: { 
  node: ConnectionNode; 
  onClick: (id: string) => void;
  selectedId: string | null;
}) {
  const isSelected = selectedId === node.id;
  const ref = useRef<THREE.Mesh>(null);
  const texture = useTexture(node.image || '/placeholders/user.png');
  
  // Status color mapping
  const statusColors = {
    online: '#10b981', // Green
    away: '#f59e0b',   // Amber
    offline: '#6b7280' // Gray
  };
  
  // Hover state
  const [hovered, setHovered] = useState(false);
  
  // Animation
  useFrame((state) => {
    if (!ref.current) return;
    
    // Breathing effect
    ref.current.scale.x = ref.current.scale.y = ref.current.scale.z = 
      1 + Math.sin(state.clock.elapsedTime * (isSelected ? 2 : 1)) * 0.05;
      
    // Subtle position movement
    ref.current.position.y += Math.sin(state.clock.elapsedTime + parseInt(node.id)) * 0.0005;
  });

  return (
    <group position={node.position}>
      {/* User sphere */}
      <mesh
        ref={ref}
        onClick={() => onClick(node.id)}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        scale={isSelected ? 1.2 : 1}
      >
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial 
          map={texture}
          emissive={isSelected ? "#ffffff" : hovered ? "#aaaaaa" : "#000000"} 
          emissiveIntensity={isSelected ? 0.5 : hovered ? 0.2 : 0}
          metalness={0.5}
          roughness={0.5}
        />
      </mesh>
      
      {/* Status indicator */}
      <mesh position={[0.4, 0.4, 0.4]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color={statusColors[node.status]} emissive={statusColors[node.status]} emissiveIntensity={0.5} />
      </mesh>
      
      {/* User name label (only show when hovered or selected) */}
      {(hovered || isSelected) && (
        <Billboard position={[0, -0.7, 0]}>
          <Text
            color="white"
            fontSize={0.15}
            maxWidth={2}
            lineHeight={1}
            textAlign="center"
            font="/fonts/Inter-Bold.woff"
          >
            {node.name}
          </Text>
          <Text
            position={[0, -0.2, 0]}
            color="#a78bfa"
            fontSize={0.1}
            maxWidth={2}
            lineHeight={1}
            textAlign="center"
            font="/fonts/Inter-Regular.woff"
          >
            @{node.username}
          </Text>
        </Billboard>
      )}
      
      {/* Detailed info when selected */}
      {isSelected && (
        <Html position={[1, 0, 0]} distanceFactor={10} transform>
          <div className="w-48 overflow-hidden rounded-lg bg-black/70 p-3 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white">{node.name}</h4>
              <ReputationScore score={node.reputationScore} userId={node.id} size="sm" />
            </div>
            <p className="text-xs text-indigo-300">@{node.username}</p>
            <div className="mt-2 flex items-center space-x-1">
              <span className={`h-2 w-2 rounded-full ${
                node.status === 'online' ? 'bg-green-500' :
                node.status === 'away' ? 'bg-amber-500' : 'bg-gray-500'
              }`}></span>
              <span className="text-xs capitalize text-gray-300">{node.status}</span>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-center text-xs text-gray-400">
              <div>Connections: {node.connections.length}</div>
              <div>Score: {node.reputationScore}</div>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

// Connection line component
function ConnectionLine({ startId, endId, nodes, selectedId }: { 
  startId: string; 
  endId: string;
  nodes: Record<string, ConnectionNode>;
  selectedId: string | null;
}) {
  const startNode = nodes[startId];
  const endNode = nodes[endId];
  
  if (!startNode || !endNode) return null;
  
  const start = new Vector3(...startNode.position);
  const end = new Vector3(...endNode.position);
  
  const isHighlighted = selectedId === startId || selectedId === endId;
  
  // Calculate the midpoint with a slight offset to create a curve
  const mid = new Vector3().addVectors(start, end).divideScalar(2);
  const normal = new Vector3().subVectors(end, start).normalize();
  const perpendicular = new Vector3(-normal.z, 0, normal.x).normalize();
  
  // Add a slight curve in the Y direction and perpendicular to the line
  const curveHeight = start.distanceTo(end) * 0.15;
  mid.add(perpendicular.multiplyScalar(curveHeight * 0.5));
  mid.y += curveHeight;
  
  // Create a simple curved line using a quadratic bezier curve
  const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
  const points = curve.getPoints(20);
  
  return (
    <group>
      <line>
        <bufferGeometry attach="geometry">
          <bufferAttribute
            attach="attributes-position"
            array={new Float32Array(points.flatMap(p => [p.x, p.y, p.z]))}
            count={points.length}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial 
          attach="material" 
          color={isHighlighted ? "#a78bfa" : "#4b5563"} 
          linewidth={1} 
          opacity={isHighlighted ? 0.8 : 0.3} 
          transparent 
        />
      </line>
    </group>
  );
}

// Network graph component
function NetworkGraph({ data, onSelectNode }: { 
  data: ConnectionNode[];
  onSelectNode: (node: ConnectionNode | null) => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { camera } = useThree();
  
  // Convert array to map for easier access
  const nodesMap = data.reduce((acc, node) => {
    acc[node.id] = node;
    return acc;
  }, {} as Record<string, ConnectionNode>);
  
  // Handle node selection
  const handleNodeClick = (id: string) => {
    const newSelectedId = id === selectedId ? null : id;
    setSelectedId(newSelectedId);
    onSelectNode(newSelectedId ? nodesMap[newSelectedId] : null);
    
    // Move camera to focus on the selected node
    if (newSelectedId) {
      const position = nodesMap[newSelectedId].position;
      camera.position.set(position[0] + 3, position[1] + 3, position[2] + 3);
      camera.lookAt(position[0], position[1], position[2]);
    }
  };
  
  // Generate all connection lines
  const connectionLines = data.flatMap(node => 
    node.connections.map(targetId => ({
      key: `${node.id}-${targetId}`,
      startId: node.id,
      endId: targetId
    }))
  );
  
  // Filter unique connections (avoid duplicates)
  const uniqueConnections = connectionLines.filter((conn, index, self) => 
    index === self.findIndex(c => 
      (c.startId === conn.startId && c.endId === conn.endId) || 
      (c.startId === conn.endId && c.endId === conn.startId)
    )
  );

  return (
    <>
      {/* Draw all connection lines */}
      {uniqueConnections.map(({ key, startId, endId }) => (
        <ConnectionLine 
          key={key} 
          startId={startId} 
          endId={endId} 
          nodes={nodesMap}
          selectedId={selectedId}
        />
      ))}
      
      {/* Draw all user nodes */}
      {data.map(node => (
        <UserNode 
          key={node.id} 
          node={node} 
          onClick={handleNodeClick}
          selectedId={selectedId} 
        />
      ))}
    </>
  );
}

interface ConnectionsMapProps {
  userId: string;
  title?: string;
  className?: string;
}

export default function ConnectionsMap({ userId, title = 'Your Network', className = '' }: ConnectionsMapProps) {
  const [selectedNode, setSelectedNode] = useState<ConnectionNode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [networkData, setNetworkData] = useState<ConnectionNode[]>([]);
  
  // Load network data
  useEffect(() => {
    // In a real app, this would fetch from an API
    const loadNetworkData = async () => {
      setIsLoading(true);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate mock data
      const mockData: ConnectionNode[] = [
        {
          id: userId,
          name: "Current User",
          username: "currentuser",
          image: "/placeholders/user.png",
          reputationScore: 87,
          status: 'online',
          position: [0, 0, 0],
          connections: ['2', '3', '4', '5']
        },
        {
          id: '2',
          name: "Alex Smith",
          username: "alexsmith",
          image: "/placeholders/user.png",
          reputationScore: 92,
          status: 'online',
          position: [2, 0.5, 1],
          connections: [userId, '3', '7']
        },
        {
          id: '3',
          name: "Jamie Lee",
          username: "jamielee",
          image: "/placeholders/user.png",
          reputationScore: 76,
          status: 'away',
          position: [-1.5, 0, 2],
          connections: [userId, '2', '5']
        },
        {
          id: '4',
          name: "Chris Wong",
          username: "chriswong",
          image: "/placeholders/user.png",
          reputationScore: 65,
          status: 'online',
          position: [1, -1, -2],
          connections: [userId, '6', '7']
        },
        {
          id: '5',
          name: "Taylor Kim",
          username: "taylorkim",
          image: "/placeholders/user.png",
          reputationScore: 81,
          status: 'offline',
          position: [-2, 0.5, -1],
          connections: [userId, '3']
        },
        {
          id: '6',
          name: "Jordan Ray",
          username: "jordanray",
          image: "/placeholders/user.png",
          reputationScore: 94,
          status: 'online',
          position: [3, -0.5, -3],
          connections: ['4', '7']
        },
        {
          id: '7',
          name: "Casey Nova",
          username: "caseynova",
          image: "/placeholders/user.png",
          reputationScore: 88,
          status: 'offline',
          position: [2.5, 1, -2],
          connections: ['2', '4', '6']
        }
      ];
      
      setNetworkData(mockData);
      setIsLoading(false);
    };
    
    loadNetworkData();
  }, [userId]);

  return (
    <div className={`overflow-hidden rounded-xl bg-gray-900/60 backdrop-blur-lg ${className}`}>
      <div className="flex items-center justify-between border-b border-gray-800 p-4">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        
        {selectedNode && (
          <button
            onClick={() => setSelectedNode(null)}
            className="rounded-md bg-gray-800 px-2 py-1 text-xs text-gray-300 hover:bg-gray-700"
          >
            Reset View
          </button>
        )}
      </div>
      
      <div className="relative h-[400px] w-full">
        {isLoading ? (
          <div className="flex h-full w-full items-center justify-center">
            <div className="flex flex-col items-center">
              <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-t-2 border-indigo-500"></div>
              <p className="mt-4 text-sm text-gray-400">Loading your network...</p>
            </div>
          </div>
        ) : (
          <>
            <Canvas 
              camera={{ position: [5, 5, 5], fov: 60 }}
              style={{ background: 'transparent' }}
            >
              <ambientLight intensity={0.5} />
              <pointLight position={[10, 10, 10]} intensity={0.8} />
              <pointLight position={[-10, -10, -10]} intensity={0.4} color="#8b5cf6" />
              
              <NetworkGraph data={networkData} onSelectNode={setSelectedNode} />
              
              <OrbitControls 
                enableZoom={true}
                enablePan={true}
                enableRotate={true}
                minDistance={3}
                maxDistance={20}
                dampingFactor={0.1}
              />
            </Canvas>
            
            {/* Overlay instructions */}
            <div className="absolute bottom-4 left-4 rounded-md bg-black/40 p-2 text-xs text-gray-300 backdrop-blur-sm">
              <div>Drag to rotate • Scroll to zoom • Click nodes to select</div>
            </div>
          </>
        )}
      </div>
      
      {/* Selected user details */}
      {selectedNode && (
        <motion.div 
          className="border-t border-gray-800 p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-indigo-500">
              <img 
                src={selectedNode.image || '/placeholders/user.png'} 
                alt={selectedNode.name}
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="font-semibold text-white">{selectedNode.name}</h4>
                <ReputationScore score={selectedNode.reputationScore} userId={selectedNode.id} size="sm" />
              </div>
              <p className="text-sm text-indigo-400">@{selectedNode.username}</p>
            </div>
          </div>
          
          <div className="mt-4 flex justify-center space-x-4">
            <button className="rounded-md bg-indigo-600 px-3 py-1 text-sm font-medium text-white hover:bg-indigo-700">
              View Profile
            </button>
            <button className="rounded-md bg-gray-800 px-3 py-1 text-sm font-medium text-gray-200 hover:bg-gray-700">
              Send Message
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
