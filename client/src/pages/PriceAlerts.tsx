import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { 
  Bell, 
  BellRing, 
  Plus, 
  Trash2, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  BarChart3,
  RefreshCw,
  Wallet,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Target
} from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { usePhantomWallet } from '@/contexts/PhantomContext';
import MainLayout from '@/components/MainLayout';

export default function PriceAlerts() {
  const { isConnected, openModal, getSolanaAddress } = usePhantomWallet();
  const walletAddress = getSolanaAddress();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newAlert, setNewAlert] = useState({
    tokenMint: '',
    tokenSymbol: '',
    alertType: 'price_above' as 'price_above' | 'price_below' | 'mcap_above' | 'mcap_below' | 'graduation',
    targetValue: '',
    notifyEmail: false,
    notifyPush: true,
  });

  const { data: alerts, isLoading, refetch } = trpc.priceAlerts.getAlerts.useQuery(
    { walletAddress: walletAddress || '' },
    { enabled: !!walletAddress }
  );

  const { data: triggeredAlerts } = trpc.priceAlerts.getAlerts.useQuery(
    { walletAddress: walletAddress || '', isActive: false },
    { enabled: !!walletAddress, select: (data) => data?.filter((a: any) => a.isTriggered) }
  );

  const createAlertMutation = trpc.priceAlerts.create.useMutation({
    onSuccess: () => {
      toast.success('Price alert created successfully');
      setIsCreateDialogOpen(false);
      setNewAlert({
        tokenMint: '',
        tokenSymbol: '',
        alertType: 'price_above',
        targetValue: '',
        notifyEmail: false,
        notifyPush: true,
      });
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to create alert: ${error.message}`);
    },
  });

  const deleteAlertMutation = trpc.priceAlerts.delete.useMutation({
    onSuccess: () => {
      toast.success('Alert deleted');
      refetch();
    },
    onError: (error: any) => {
      toast.error(`Failed to delete alert: ${error.message}`);
    },
  });

  const toggleAlertMutation = trpc.priceAlerts.toggle.useMutation({
    onSuccess: () => {
      refetch();
    },
    onError: (error: any) => {
      toast.error(`Failed to toggle alert: ${error.message}`);
    },
  });

  const handleCreateAlert = () => {
    if (!walletAddress) {
      toast.error('Please connect your wallet');
      return;
    }
    if (!newAlert.tokenMint || !newAlert.targetValue) {
      toast.error('Please fill in all required fields');
      return;
    }

    createAlertMutation.mutate({
      walletAddress,
      tokenMint: newAlert.tokenMint,
      tokenSymbol: newAlert.tokenSymbol || undefined,
      alertType: newAlert.alertType,
      targetValue: newAlert.targetValue,
      notificationMethod: newAlert.notifyEmail ? 'email' : newAlert.notifyPush ? 'push' : 'in_app',
    });
  };

  const getAlertTypeIcon = (type: string) => {
    switch (type) {
      case 'price_above':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'price_below':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'mcap_above':
        return <BarChart3 className="h-4 w-4 text-blue-500" />;
      case 'mcap_below':
        return <BarChart3 className="h-4 w-4 text-orange-500" />;
      case 'graduation':
        return <Target className="h-4 w-4 text-purple-500" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getAlertTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      price_above: 'Price Above',
      price_below: 'Price Below',
      mcap_above: 'Market Cap Above',
      mcap_below: 'Market Cap Below',
      graduation: 'Graduation',
    };
    return labels[type] || type;
  };

  const formatValue = (type: string, value: string) => {
    if (type === 'graduation') return 'When token graduates';
    if (type.includes('mcap')) return `$${parseFloat(value).toLocaleString()}`;
    return `${parseFloat(value).toFixed(9)} SOL`;
  };

  if (!isConnected) {
    return (
      <MainLayout>
        <div className="container py-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6 text-center">
              <Wallet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-bold mb-2">Connect Wallet</h2>
              <p className="text-muted-foreground mb-4">
                Connect your wallet to manage price alerts
              </p>
              <Button onClick={openModal}>
                <Wallet className="h-4 w-4 mr-2" />
                Connect Phantom
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <BellRing className="h-8 w-8 text-yellow-500" />
              Price Alerts
            </h1>
            <p className="text-muted-foreground">
              Get notified when tokens reach your target prices or market caps
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Alert
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Price Alert</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="tokenMint">Token Mint Address *</Label>
                    <Input
                      id="tokenMint"
                      placeholder="Enter token mint address"
                      value={newAlert.tokenMint}
                      onChange={(e) => setNewAlert({ ...newAlert, tokenMint: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tokenSymbol">Token Symbol (optional)</Label>
                    <Input
                      id="tokenSymbol"
                      placeholder="e.g., KIT"
                      value={newAlert.tokenSymbol}
                      onChange={(e) => setNewAlert({ ...newAlert, tokenSymbol: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="alertType">Alert Type</Label>
                    <Select
                      value={newAlert.alertType}
                      onValueChange={(value: any) => setNewAlert({ ...newAlert, alertType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="price_above">Price Above</SelectItem>
                        <SelectItem value="price_below">Price Below</SelectItem>
                        <SelectItem value="mcap_above">Market Cap Above</SelectItem>
                        <SelectItem value="mcap_below">Market Cap Below</SelectItem>
                        <SelectItem value="graduation">Graduation (Bonding Curve Complete)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {newAlert.alertType !== 'graduation' && (
                    <div className="space-y-2">
                      <Label htmlFor="targetValue">
                        Target Value * {newAlert.alertType.includes('mcap') ? '(USD)' : '(SOL)'}
                      </Label>
                      <Input
                        id="targetValue"
                        type="number"
                        step="any"
                        placeholder={newAlert.alertType.includes('mcap') ? 'e.g., 1000000' : 'e.g., 0.000001'}
                        value={newAlert.targetValue}
                        onChange={(e) => setNewAlert({ ...newAlert, targetValue: e.target.value })}
                      />
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <Label htmlFor="notifyPush">Push Notifications</Label>
                    <Switch
                      id="notifyPush"
                      checked={newAlert.notifyPush}
                      onCheckedChange={(checked) => setNewAlert({ ...newAlert, notifyPush: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="notifyEmail">Email Notifications</Label>
                    <Switch
                      id="notifyEmail"
                      checked={newAlert.notifyEmail}
                      onCheckedChange={(checked) => setNewAlert({ ...newAlert, notifyEmail: checked })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateAlert} disabled={createAlertMutation.isPending}>
                    {createAlertMutation.isPending ? 'Creating...' : 'Create Alert'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-sm text-muted-foreground">Active Alerts</div>
              <div className="text-2xl font-bold">
                {alerts?.filter(a => a.isActive).length || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-sm text-muted-foreground">Total Alerts</div>
              <div className="text-2xl font-bold">{alerts?.length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-sm text-muted-foreground">Triggered Today</div>
              <div className="text-2xl font-bold text-green-500">
                {(triggeredAlerts || []).filter((a: any) => {
                  const today = new Date();
                  const triggered = new Date(a.triggeredAt!);
                  return triggered.toDateString() === today.toDateString();
                }).length || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-sm text-muted-foreground">Pending</div>
              <div className="text-2xl font-bold text-yellow-500">
                {alerts?.filter(a => a.isActive && !a.triggeredAt).length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Active Alerts
            </CardTitle>
            <CardDescription>
              Alerts that are currently being monitored
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse flex gap-4">
                    <div className="h-12 bg-muted rounded w-full"></div>
                  </div>
                ))}
              </div>
            ) : alerts && alerts.filter(a => a.isActive).length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Token</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Notifications</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alerts.filter(a => a.isActive).map((alert) => (
                    <TableRow key={alert.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {alert.tokenSymbol || alert.tokenMint.slice(0, 8) + '...'}
                          </div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {alert.tokenMint.slice(0, 16)}...
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getAlertTypeIcon(alert.alertType)}
                          <span>{getAlertTypeLabel(alert.alertType)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono">
                        {formatValue(alert.alertType, alert.targetValue)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {alert.notificationMethod === 'push' ? 'Push' : 
                           alert.notificationMethod === 'email' ? 'Email' : 'In-App'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400">
                          <Clock className="h-3 w-3 mr-1" />
                          Monitoring
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleAlertMutation.mutate({ id: alert.id })}
                          >
                            Pause
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-600"
                            onClick={() => deleteAlertMutation.mutate({ id: alert.id })}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No active alerts</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first price alert to get notified
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Alert
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Triggered Alerts History */}
        {triggeredAlerts && triggeredAlerts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Recently Triggered
              </CardTitle>
              <CardDescription>
                Alerts that have been triggered
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Token</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Triggered Value</TableHead>
                    <TableHead>Triggered At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {triggeredAlerts.map((alert: any) => (
                    <TableRow key={alert.id}>
                      <TableCell>
                        <div className="font-medium">
                          {alert.tokenSymbol || alert.tokenMint.slice(0, 8) + '...'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getAlertTypeIcon(alert.alertType)}
                          <span>{getAlertTypeLabel(alert.alertType)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono">
                        {formatValue(alert.alertType, alert.targetValue)}
                      </TableCell>
                      <TableCell className="font-mono text-green-500">
                        {alert.triggeredValue ? formatValue(alert.alertType, alert.triggeredValue) : '-'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {alert.triggeredAt ? new Date(alert.triggeredAt).toLocaleString() : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Paused Alerts */}
        {alerts && alerts.filter(a => !a.isActive).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-muted-foreground">
                <AlertTriangle className="h-5 w-5" />
                Paused Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Token</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alerts.filter(a => !a.isActive).map((alert) => (
                    <TableRow key={alert.id} className="opacity-60">
                      <TableCell>
                        {alert.tokenSymbol || alert.tokenMint.slice(0, 8) + '...'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getAlertTypeIcon(alert.alertType)}
                          <span>{getAlertTypeLabel(alert.alertType)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono">
                        {formatValue(alert.alertType, alert.targetValue)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleAlertMutation.mutate({ id: alert.id })}
                          >
                            Resume
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500"
                            onClick={() => deleteAlertMutation.mutate({ id: alert.id })}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
