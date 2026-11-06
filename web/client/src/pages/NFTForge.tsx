import { useState, useEffect, useMemo } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { mplBubblegum, createTree, mintV1 } from '@metaplex-foundation/mpl-bubblegum';
import { mplTokenMetadata, createNft } from '@metaplex-foundation/mpl-token-metadata';
import { 
  generateSigner, 
  percentAmount, 
  publicKey as umiPublicKey,
  signerIdentity,
  createNoopSigner,
  none,
  some,
} from '@metaplex-foundation/umi';
import { walletAdapterIdentity } from '@metaplex-foundation/umi-signer-wallet-adapters';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Loader2, 
  Wallet, 
  Sparkles, 
  TreePine, 
  Image as ImageIcon, 
  Stamp, 
  Grid3X3,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  AlertCircle,
  Info,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import MainLayout from '@/components/MainLayout';

interface NFTAsset {
  id: string;
  name: string;
  symbol: string;
  uri: string;
  image: string;
  owner: string;
  compressed: boolean;
  collection: string | null;
  attributes: unknown[];
}

interface TreeCost {
  depth: number;
  costSol: number;
  capacity: number;
  label: string;
}

export default function NFTForge() {
  const wallet = useWallet();
  const [activeTab, setActiveTab] = useState('mint');
  const [copied, setCopied] = useState<string | null>(null);
  
  // Mint form state
  const [passportName, setPassportName] = useState('');
  const [robotId, setRobotId] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [selectedTree, setSelectedTree] = useState('');
  const [selectedCollection, setSelectedCollection] = useState('');
  const [isMinting, setIsMinting] = useState(false);
  
  // Tree creation state
  const [selectedTreeSize, setSelectedTreeSize] = useState<number>(14);
  const [isPublicTree, setIsPublicTree] = useState(false);
  const [isCreatingTree, setIsCreatingTree] = useState(false);
  
  // Collection creation state
  const [collectionName, setCollectionName] = useState('');
  const [collectionSymbol, setCollectionSymbol] = useState('');
  const [collectionDescription, setCollectionDescription] = useState('');
  const [collectionImage, setCollectionImage] = useState('');
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);
  
  // Custom attributes
  const [customAttributes, setCustomAttributes] = useState<Array<{ trait_type: string; value: string }>>([]);

  // Queries
  const { data: config } = trpc.nftForge.getConfig.useQuery();
  const { data: treeCosts } = trpc.nftForge.getTreeCosts.useQuery();
  const { data: isConfigured } = trpc.nftForge.isConfigured.useQuery();
  
  const { data: userAssets, refetch: refetchAssets, isLoading: isLoadingAssets } = trpc.nftForge.getAssetsByOwner.useQuery(
    { ownerAddress: wallet.publicKey?.toBase58() || '' },
    { enabled: !!wallet.publicKey }
  );

  // Create Umi instance with wallet adapter
  const umi = useMemo(() => {
    if (!config?.rpcUrl) return null;
    
    const umiInstance = createUmi(config.rpcUrl)
      .use(mplBubblegum())
      .use(mplTokenMetadata());
    
    if (wallet.publicKey && wallet.signTransaction) {
      umiInstance.use(walletAdapterIdentity(wallet));
    }
    
    return umiInstance;
  }, [config?.rpcUrl, wallet]);

  // Copy to clipboard
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
    toast.success('Copied to clipboard');
  };

  // Add custom attribute
  const addAttribute = () => {
    setCustomAttributes([...customAttributes, { trait_type: '', value: '' }]);
  };

  // Remove custom attribute
  const removeAttribute = (index: number) => {
    setCustomAttributes(customAttributes.filter((_, i) => i !== index));
  };

  // Update custom attribute
  const updateAttribute = (index: number, field: 'trait_type' | 'value', value: string) => {
    const updated = [...customAttributes];
    updated[index][field] = value;
    setCustomAttributes(updated);
  };

  // Create Merkle Tree
  const handleCreateTree = async () => {
    if (!wallet.publicKey || !umi) {
      toast.error('Please connect your wallet');
      return;
    }

    setIsCreatingTree(true);
    try {
      const merkleTree = generateSigner(umi);
      
      const selectedCost = treeCosts?.find(t => t.depth === selectedTreeSize);
      
      toast.info(`Creating Merkle Tree with ${selectedCost?.capacity.toLocaleString()} capacity...`);
      toast.info(`Estimated cost: ${selectedCost?.costSol} SOL`);

      const builder = await createTree(umi, {
        merkleTree,
        maxDepth: selectedTreeSize,
        maxBufferSize: 64,
        public: isPublicTree,
      });

      const { signature } = await builder.sendAndConfirm(umi);
      
      toast.success('Merkle Tree created successfully!');
      toast.info(`Tree Address: ${merkleTree.publicKey}`);
      
      setSelectedTree(merkleTree.publicKey.toString());
    } catch (error) {
      console.error('Failed to create tree:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create Merkle Tree');
    } finally {
      setIsCreatingTree(false);
    }
  };

  // Create Collection NFT
  const handleCreateCollection = async () => {
    if (!wallet.publicKey || !umi) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!collectionName || !collectionSymbol || !collectionImage) {
      toast.error('Please fill in all collection fields');
      return;
    }

    setIsCreatingCollection(true);
    try {
      const collectionMint = generateSigner(umi);
      
      toast.info('Creating Collection NFT...');

      await createNft(umi, {
        mint: collectionMint,
        name: collectionName,
        symbol: collectionSymbol,
        uri: collectionImage, // In production, upload metadata JSON first
        sellerFeeBasisPoints: percentAmount(5),
        isCollection: true,
      }).sendAndConfirm(umi);
      
      toast.success('Collection created successfully!');
      toast.info(`Collection Address: ${collectionMint.publicKey}`);
      
      setSelectedCollection(collectionMint.publicKey.toString());
    } catch (error) {
      console.error('Failed to create collection:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create collection');
    } finally {
      setIsCreatingCollection(false);
    }
  };

  // Mint Robot Passport cNFT
  const handleMint = async () => {
    if (!wallet.publicKey || !umi) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!passportName || !robotId || !selectedTree) {
      toast.error('Please fill in all required fields and select a Merkle Tree');
      return;
    }

    setIsMinting(true);
    try {
      const merkleTree = umiPublicKey(selectedTree);
      const leafOwner = umiPublicKey(wallet.publicKey.toBase58());
      
      // Build attributes
      const attributes = [
        { trait_type: 'Robot ID', value: robotId },
        { trait_type: 'Issued', value: new Date().toISOString().split('T')[0] },
        { trait_type: 'Status', value: 'Active' },
        ...customAttributes.filter(a => a.trait_type && a.value),
      ];

      toast.info('Minting Robot Passport...');

      // Mint the cNFT
      const { signature } = await mintV1(umi, {
        leafOwner,
        merkleTree,
        metadata: {
          name: `Robot Passport: ${passportName}`,
          symbol: 'RPASS',
          uri: imageUrl || 'https://arweave.net/placeholder', // In production, upload metadata first
          sellerFeeBasisPoints: 500,
          collection: selectedCollection ? some({ key: umiPublicKey(selectedCollection), verified: false }) : none(),
          creators: [
            {
              address: leafOwner,
              verified: false,
              share: 100,
            },
          ],
        },
      }).sendAndConfirm(umi);
      
      toast.success('Robot Passport minted successfully!');
      
      // Refresh assets
      setTimeout(() => refetchAssets(), 2000);
      
      // Reset form
      setPassportName('');
      setRobotId('');
      setDescription('');
      setImageUrl('');
      setCustomAttributes([]);
    } catch (error) {
      console.error('Failed to mint:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to mint Robot Passport');
    } finally {
      setIsMinting(false);
    }
  };

  if (!isConfigured) {
    return (
      <MainLayout>
        <div className="container py-8">
          <Card className="border-yellow-500/50 bg-yellow-500/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-500" />
                Configuration Required
              </CardTitle>
              <CardDescription>
                Metaplex integration requires a DAS-enabled RPC endpoint. Please configure HELIUS_RPC_URL or RPC_URL environment variable.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Stamp className="h-8 w-8 text-primary" />
              Robot Passport Forge
            </h1>
            <p className="text-muted-foreground mt-1">
              Mint compressed NFT passports for your robots using Metaplex Bubblegum
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <WalletMultiButton className="!bg-primary hover:!bg-primary/90" />
          </div>
        </div>

        {/* Wallet Connection Required */}
        {!wallet.publicKey && (
          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="py-8 text-center">
              <Wallet className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2">Connect Your Wallet</h3>
              <p className="text-muted-foreground mb-4">
                Connect your Solana wallet to mint Robot Passports and manage your NFT collection
              </p>
              <WalletMultiButton className="!bg-primary hover:!bg-primary/90" />
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        {wallet.publicKey && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
              <TabsTrigger value="mint" className="gap-2">
                <Sparkles className="h-4 w-4" />
                <span className="hidden sm:inline">Mint Passport</span>
                <span className="sm:hidden">Mint</span>
              </TabsTrigger>
              <TabsTrigger value="tree" className="gap-2">
                <TreePine className="h-4 w-4" />
                <span className="hidden sm:inline">Create Tree</span>
                <span className="sm:hidden">Tree</span>
              </TabsTrigger>
              <TabsTrigger value="collection" className="gap-2">
                <Grid3X3 className="h-4 w-4" />
                <span className="hidden sm:inline">Collection</span>
                <span className="sm:hidden">Coll.</span>
              </TabsTrigger>
              <TabsTrigger value="gallery" className="gap-2">
                <ImageIcon className="h-4 w-4" />
                <span className="hidden sm:inline">My NFTs</span>
                <span className="sm:hidden">NFTs</span>
              </TabsTrigger>
            </TabsList>

            {/* Mint Passport Tab */}
            <TabsContent value="mint" className="space-y-6">
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Mint Form */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5" />
                      Mint Robot Passport
                    </CardTitle>
                    <CardDescription>
                      Create a compressed NFT passport for your robot
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="passportName">Robot Name *</Label>
                      <Input
                        id="passportName"
                        placeholder="Enter robot name"
                        value={passportName}
                        onChange={(e) => setPassportName(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="robotId">Robot ID *</Label>
                      <Input
                        id="robotId"
                        placeholder="Unique robot identifier"
                        value={robotId}
                        onChange={(e) => setRobotId(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Describe your robot..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="imageUrl">Image URL</Label>
                      <Input
                        id="imageUrl"
                        placeholder="https://..."
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="merkleTree">Merkle Tree *</Label>
                      <Input
                        id="merkleTree"
                        placeholder="Merkle Tree address"
                        value={selectedTree}
                        onChange={(e) => setSelectedTree(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Create a tree in the "Create Tree" tab if you don't have one
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="collection">Collection (Optional)</Label>
                      <Input
                        id="collection"
                        placeholder="Collection address"
                        value={selectedCollection}
                        onChange={(e) => setSelectedCollection(e.target.value)}
                      />
                    </div>

                    {/* Custom Attributes */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Custom Attributes</Label>
                        <Button type="button" variant="outline" size="sm" onClick={addAttribute}>
                          Add Attribute
                        </Button>
                      </div>
                      {customAttributes.map((attr, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            placeholder="Trait type"
                            value={attr.trait_type}
                            onChange={(e) => updateAttribute(index, 'trait_type', e.target.value)}
                            className="flex-1"
                          />
                          <Input
                            placeholder="Value"
                            value={attr.value}
                            onChange={(e) => updateAttribute(index, 'value', e.target.value)}
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeAttribute(index)}
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>

                    <Button
                      className="w-full"
                      onClick={handleMint}
                      disabled={isMinting || !passportName || !robotId || !selectedTree}
                    >
                      {isMinting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Minting...
                        </>
                      ) : (
                        <>
                          <Zap className="mr-2 h-4 w-4" />
                          Mint Robot Passport
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* Preview Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>Preview</CardTitle>
                    <CardDescription>
                      Your Robot Passport will look like this
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-lg p-4 bg-gradient-to-br from-primary/5 to-primary/10">
                      <div className="aspect-square rounded-lg bg-muted mb-4 flex items-center justify-center overflow-hidden">
                        {imageUrl ? (
                          <img 
                            src={imageUrl} 
                            alt="Robot Passport" 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23333" width="100" height="100"/><text x="50" y="55" text-anchor="middle" fill="%23666" font-size="12">No Image</text></svg>';
                            }}
                          />
                        ) : (
                          <ImageIcon className="h-16 w-16 text-muted-foreground" />
                        )}
                      </div>
                      <h3 className="font-bold text-lg">
                        {passportName ? `Robot Passport: ${passportName}` : 'Robot Passport: [Name]'}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        RPASS
                      </p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Robot ID</span>
                          <span>{robotId || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Status</span>
                          <Badge variant="secondary">Active</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Issued</span>
                          <span>{new Date().toISOString().split('T')[0]}</span>
                        </div>
                        {customAttributes.filter(a => a.trait_type && a.value).map((attr, i) => (
                          <div key={i} className="flex justify-between">
                            <span className="text-muted-foreground">{attr.trait_type}</span>
                            <span>{attr.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Create Tree Tab */}
            <TabsContent value="tree" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TreePine className="h-5 w-5" />
                    Create Merkle Tree
                  </CardTitle>
                  <CardDescription>
                    A Merkle Tree is required to store compressed NFTs. Choose a size based on how many NFTs you plan to mint.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {treeCosts?.map((tree) => (
                      <Card
                        key={tree.depth}
                        className={`cursor-pointer transition-all ${
                          selectedTreeSize === tree.depth
                            ? 'border-primary ring-2 ring-primary/20'
                            : 'hover:border-primary/50'
                        }`}
                        onClick={() => setSelectedTreeSize(tree.depth)}
                      >
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-primary">
                            {tree.capacity.toLocaleString()}
                          </div>
                          <div className="text-sm text-muted-foreground mb-2">
                            {tree.label}
                          </div>
                          <Badge variant="outline">
                            ~{tree.costSol} SOL
                          </Badge>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isPublicTree}
                        onChange={(e) => setIsPublicTree(e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">
                        Public Tree (anyone can mint)
                      </span>
                    </label>
                  </div>

                  <div className="flex items-start gap-2 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-500">Important</p>
                      <p className="text-muted-foreground">
                        Merkle Trees cannot be closed or refunded once created. Make sure you have enough SOL and choose the right size for your needs.
                      </p>
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    onClick={handleCreateTree}
                    disabled={isCreatingTree}
                  >
                    {isCreatingTree ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Tree...
                      </>
                    ) : (
                      <>
                        <TreePine className="mr-2 h-4 w-4" />
                        Create Merkle Tree (~{treeCosts?.find(t => t.depth === selectedTreeSize)?.costSol} SOL)
                      </>
                    )}
                  </Button>

                  {selectedTree && (
                    <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-green-500">Tree Created!</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(selectedTree, 'tree')}
                        >
                          {copied === 'tree' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                      <p className="text-xs font-mono mt-1 break-all">{selectedTree}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Collection Tab */}
            <TabsContent value="collection" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Grid3X3 className="h-5 w-5" />
                    Create Collection
                  </CardTitle>
                  <CardDescription>
                    Create a collection NFT to group your Robot Passports together
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="collectionName">Collection Name *</Label>
                    <Input
                      id="collectionName"
                      placeholder="Robot Passport Collection"
                      value={collectionName}
                      onChange={(e) => setCollectionName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="collectionSymbol">Symbol *</Label>
                    <Input
                      id="collectionSymbol"
                      placeholder="RPASS"
                      value={collectionSymbol}
                      onChange={(e) => setCollectionSymbol(e.target.value.toUpperCase())}
                      maxLength={10}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="collectionDescription">Description</Label>
                    <Textarea
                      id="collectionDescription"
                      placeholder="Describe your collection..."
                      value={collectionDescription}
                      onChange={(e) => setCollectionDescription(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="collectionImage">Collection Image URL *</Label>
                    <Input
                      id="collectionImage"
                      placeholder="https://..."
                      value={collectionImage}
                      onChange={(e) => setCollectionImage(e.target.value)}
                    />
                  </div>

                  <Button
                    className="w-full"
                    onClick={handleCreateCollection}
                    disabled={isCreatingCollection || !collectionName || !collectionSymbol || !collectionImage}
                  >
                    {isCreatingCollection ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Collection...
                      </>
                    ) : (
                      <>
                        <Grid3X3 className="mr-2 h-4 w-4" />
                        Create Collection
                      </>
                    )}
                  </Button>

                  {selectedCollection && (
                    <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-green-500">Collection Created!</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(selectedCollection, 'collection')}
                        >
                          {copied === 'collection' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                      <p className="text-xs font-mono mt-1 break-all">{selectedCollection}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Gallery Tab */}
            <TabsContent value="gallery" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <ImageIcon className="h-5 w-5" />
                        My Robot Passports
                      </CardTitle>
                      <CardDescription>
                        View all NFTs in your wallet
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => refetchAssets()}
                      disabled={isLoadingAssets}
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingAssets ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoadingAssets ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : userAssets?.items && userAssets.items.length > 0 ? (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {userAssets.items.map((asset: NFTAsset) => (
                        <Card key={asset.id} className="overflow-hidden">
                          <div className="aspect-square bg-muted">
                            {asset.image ? (
                              <img
                                src={asset.image}
                                alt={asset.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23333" width="100" height="100"/><text x="50" y="55" text-anchor="middle" fill="%23666" font-size="12">No Image</text></svg>';
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ImageIcon className="h-12 w-12 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <CardContent className="p-3">
                            <h4 className="font-semibold truncate">{asset.name}</h4>
                            <p className="text-xs text-muted-foreground">{asset.symbol}</p>
                            <div className="flex items-center gap-2 mt-2">
                              {asset.compressed && (
                                <Badge variant="secondary" className="text-xs">
                                  cNFT
                                </Badge>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="ml-auto h-6 w-6 p-0"
                                onClick={() => copyToClipboard(asset.id, asset.id)}
                              >
                                {copied === asset.id ? (
                                  <Check className="h-3 w-3" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                              <a
                                href={`https://solscan.io/token/${asset.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                  <ExternalLink className="h-3 w-3" />
                                </Button>
                              </a>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">No NFTs Found</h3>
                      <p className="text-muted-foreground mb-4">
                        You don't have any NFTs in your wallet yet
                      </p>
                      <Button onClick={() => setActiveTab('mint')}>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Mint Your First Passport
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </MainLayout>
  );
}
