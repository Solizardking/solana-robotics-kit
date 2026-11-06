'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Bot,
  Search,
  Plus,
  Cpu,
  Zap,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';

type RobotType = 'all' | 'market_analyst' | 'social_analyst' | 'news_analyst' | 'trader' | 'risk_manager' | 'executor';
type RobotStatus = 'active' | 'idle' | 'busy' | 'offline';

interface Robot {
  id: number;
  name: string;
  codename: string;
  type: RobotType;
  status: RobotStatus;
  platform: string;
  computeTops: number;
  powerRange: string;
  tasksCompleted: number;
  capabilities: string[];
}

const mockRobots: Robot[] = [
  {
    id: 1,
    name: 'Delivery Bot Alpha',
    codename: 'jetson-orin-001',
    type: 'market_analyst',
    status: 'active',
    platform: 'Jetson Orin Nano',
    computeTops: 40,
    powerRange: '7-15W',
    tasksCompleted: 47,
    capabilities: ['navigation', 'delivery', 'object_detection'],
  },
  {
    id: 2,
    name: 'Patrol Unit Beta',
    codename: 'jetson-orin-002',
    type: 'social_analyst',
    status: 'idle',
    platform: 'Jetson Orin Nano',
    computeTops: 40,
    powerRange: '7-15W',
    tasksCompleted: 23,
    capabilities: ['navigation', 'surveillance', 'mapping'],
  },
  {
    id: 3,
    name: 'Heavy Lifter Gamma',
    codename: 'jetson-agx-001',
    type: 'trader',
    status: 'busy',
    platform: 'Jetson AGX Orin',
    computeTops: 275,
    powerRange: '15-60W',
    tasksCompleted: 156,
    capabilities: ['manipulation', 'heavy_lift', 'object_detection'],
  },
  {
    id: 4,
    name: 'Scout Drone Delta',
    codename: 'jetson-orin-003',
    type: 'news_analyst',
    status: 'active',
    platform: 'Jetson Orin Nano',
    computeTops: 40,
    powerRange: '7-15W',
    tasksCompleted: 89,
    capabilities: ['aerial_navigation', 'mapping', 'surveillance'],
  },
  {
    id: 5,
    name: 'Assembly Bot Epsilon',
    codename: 'jetson-agx-002',
    type: 'executor',
    status: 'idle',
    platform: 'Jetson AGX Orin',
    computeTops: 275,
    powerRange: '15-60W',
    tasksCompleted: 234,
    capabilities: ['precision_assembly', 'quality_control', 'manipulation'],
  },
  {
    id: 6,
    name: 'Security Bot Zeta',
    codename: 'jetson-orin-004',
    type: 'risk_manager',
    status: 'active',
    platform: 'Jetson Orin Nano',
    computeTops: 40,
    powerRange: '7-15W',
    tasksCompleted: 312,
    capabilities: ['threat_detection', 'patrol', 'alert_system'],
  },
];

const typeLabels: Record<string, string> = {
  all: 'All Types',
  market_analyst: 'Market Analyst',
  social_analyst: 'Social Analyst',
  news_analyst: 'News Analyst',
  trader: 'Trader',
  risk_manager: 'Risk Manager',
  executor: 'Executor',
};

const statusColors: Record<RobotStatus, string> = {
  active: 'bg-green-500',
  idle: 'bg-cyan-500',
  busy: 'bg-orange-500',
  offline: 'bg-gray-500',
};

export default function RobotRegistry() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<RobotType>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredRobots = mockRobots.filter((robot) => {
    const matchesSearch = robot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      robot.codename.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || robot.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || robot.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const stats = {
    total: mockRobots.length,
    active: mockRobots.filter(r => r.status === 'active').length,
    totalTasks: mockRobots.reduce((sum, r) => sum + r.tasksCompleted, 0),
    avgTops: Math.round(mockRobots.reduce((sum, r) => sum + r.computeTops, 0) / mockRobots.length),
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-2">
            <span className="text-foreground">ROBOT</span>{' '}
            <span className="gradient-text-solana">REGISTRY</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            Register and manage autonomous robots on Solana. View capabilities, track status, and monitor task completion.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="cyber-card">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Bot className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-display text-2xl font-bold text-foreground">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total Robots</p>
              </div>
            </CardContent>
          </Card>
          <Card className="cyber-card">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                <Activity className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="font-display text-2xl font-bold text-foreground">{stats.active}</p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
            </CardContent>
          </Card>
          <Card className="cyber-card">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <p className="font-display text-2xl font-bold text-foreground">{stats.totalTasks}</p>
                <p className="text-sm text-muted-foreground">Total Tasks</p>
              </div>
            </CardContent>
          </Card>
          <Card className="cyber-card">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <Cpu className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="font-display text-2xl font-bold text-foreground">{stats.avgTops}</p>
                <p className="text-sm text-muted-foreground">Avg TOPS</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search robots..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card border-border"
            />
          </div>
          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as RobotType)}>
            <SelectTrigger className="w-full md:w-48 bg-card border-border">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(typeLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-48 bg-card border-border">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="idle">Idle</SelectItem>
              <SelectItem value="busy">Busy</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
            </SelectContent>
          </Select>
          <Button className="btn-cyber gap-2" onClick={() => toast.info('Robot registration coming soon!')}>
            <Plus className="w-5 h-5" />
            Register Robot
          </Button>
        </div>

        {/* Robot Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRobots.map((robot) => (
            <Card key={robot.id} className="cyber-card overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                      <Bot className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-display">{robot.name}</CardTitle>
                      <p className="text-sm text-muted-foreground font-mono">{robot.codename}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${statusColors[robot.status]}`} />
                    <span className="text-sm capitalize text-muted-foreground">{robot.status}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Capabilities */}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Capabilities</p>
                  <div className="flex flex-wrap gap-2">
                    {robot.capabilities.map((cap) => (
                      <Badge key={cap} variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                        {cap}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Specs */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Platform</p>
                    <p className="font-medium">{robot.platform}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Compute</p>
                    <p className="font-medium text-primary">{robot.computeTops} TOPS</p>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Zap className="w-4 h-4" />
                    {robot.powerRange}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {robot.tasksCompleted} tasks completed
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredRobots.length === 0 && (
          <div className="text-center py-16">
            <Bot className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-display text-xl font-bold mb-2">No robots found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
