"""
Metaplex Compressed NFT Minting for Robot Passports

This module provides integration with Metaplex Bubblegum for minting
Robot Passport compressed NFTs on Solana.

Requirements:
- solana-py
- anchorpy (for Bubblegum interaction)

Note: For production use, you would use the @metaplex-foundation/mpl-bubblegum
JavaScript SDK. This Python module provides helper functions for generating
the necessary transaction data.
"""

import os
import json
import base64
import hashlib
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any, Tuple
from enum import Enum


@dataclass
class MintConfig:
    """Configuration for NFT minting."""
    rpc_url: str = "https://api.devnet.solana.com"
    merkle_tree: Optional[str] = None
    collection_mint: Optional[str] = None
    tree_authority: Optional[str] = None
    payer_keypair_path: Optional[str] = None

    def __post_init__(self):
        if self.rpc_url is None:
            self.rpc_url = os.environ.get("SOLANA_RPC_URL", "https://api.devnet.solana.com")
        if self.payer_keypair_path is None:
            self.payer_keypair_path = os.environ.get(
                "SOLANA_KEYPAIR_PATH",
                os.path.expanduser("~/.config/solana/id.json")
            )


@dataclass
class CNFTMetadata:
    """Metadata structure for compressed NFT."""
    name: str
    symbol: str
    uri: str
    seller_fee_basis_points: int = 500  # 5%
    creators: List[Dict[str, Any]] = field(default_factory=list)
    collection: Optional[Dict[str, Any]] = None
    uses: Optional[Dict[str, Any]] = None
    is_mutable: bool = True
    primary_sale_happened: bool = False
    edition_nonce: Optional[int] = None
    token_standard: Optional[str] = None
    token_program_version: str = "Original"


@dataclass
class MintResult:
    """Result of minting operation."""
    success: bool
    signature: Optional[str] = None
    asset_id: Optional[str] = None
    leaf_index: Optional[int] = None
    error: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "success": self.success,
            "signature": self.signature,
            "asset_id": self.asset_id,
            "leaf_index": self.leaf_index,
            "error": self.error,
        }


class PassportMinter:
    """
    Mints Robot Passport compressed NFTs using Metaplex Bubblegum.

    This class provides methods to:
    1. Create Merkle trees for cNFT storage
    2. Mint passport cNFTs to the tree
    3. Transfer and update passport cNFTs
    """

    def __init__(self, config: Optional[MintConfig] = None):
        """Initialize the minter with configuration."""
        self.config = config or MintConfig()

    def generate_mint_instruction_data(
        self,
        metadata: CNFTMetadata,
        leaf_owner: str,
        leaf_delegate: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Generate the instruction data for minting a cNFT.

        This returns the data structure that would be used with
        the Bubblegum mintV1 instruction.

        Args:
            metadata: The NFT metadata
            leaf_owner: The owner of the cNFT
            leaf_delegate: Optional delegate authority

        Returns:
            Instruction data dictionary
        """
        return {
            "instruction": "mintV1",
            "accounts": {
                "treeAuthority": self.config.tree_authority,
                "leafOwner": leaf_owner,
                "leafDelegate": leaf_delegate or leaf_owner,
                "merkleTree": self.config.merkle_tree,
                "payer": None,  # Set by signer
                "treeDelegate": self.config.tree_authority,
                "logWrapper": "noopb9bkMVfRPU8AsBHK6gQeGJX8YCzRUEe2Mcnkg4Y6",
                "compressionProgram": "cmtDvXumGCrqC1Age74AVPhSRVXJMd8PJS91L8KbNCK",
                "bubblegumProgram": "BGUMAp9Gq7iTEuizy4pqaxsTyUCBK68MDfK752saRPUY",
            },
            "args": {
                "metadata": {
                    "name": metadata.name,
                    "symbol": metadata.symbol,
                    "uri": metadata.uri,
                    "sellerFeeBasisPoints": metadata.seller_fee_basis_points,
                    "primarySaleHappened": metadata.primary_sale_happened,
                    "isMutable": metadata.is_mutable,
                    "editionNonce": metadata.edition_nonce,
                    "tokenStandard": metadata.token_standard,
                    "collection": metadata.collection,
                    "uses": metadata.uses,
                    "tokenProgramVersion": metadata.token_program_version,
                    "creators": metadata.creators,
                },
            },
        }

    def generate_mint_to_collection_instruction_data(
        self,
        metadata: CNFTMetadata,
        leaf_owner: str,
        collection_mint: str,
        collection_authority: str,
        leaf_delegate: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Generate instruction data for minting a cNFT to a collection.

        Args:
            metadata: The NFT metadata
            leaf_owner: The owner of the cNFT
            collection_mint: The collection mint address
            collection_authority: The collection authority
            leaf_delegate: Optional delegate authority

        Returns:
            Instruction data dictionary
        """
        # Ensure collection is set in metadata
        if not metadata.collection:
            metadata.collection = {"key": collection_mint, "verified": False}

        return {
            "instruction": "mintToCollectionV1",
            "accounts": {
                "treeAuthority": self.config.tree_authority,
                "leafOwner": leaf_owner,
                "leafDelegate": leaf_delegate or leaf_owner,
                "merkleTree": self.config.merkle_tree,
                "payer": None,  # Set by signer
                "treeDelegate": self.config.tree_authority,
                "collectionAuthority": collection_authority,
                "collectionAuthorityRecordPda": None,  # If using delegated authority
                "collectionMint": collection_mint,
                "collectionMetadata": None,  # Derived from collection mint
                "editionAccount": None,  # Derived
                "bubblegumSigner": None,  # Derived
                "logWrapper": "noopb9bkMVfRPU8AsBHK6gQeGJX8YCzRUEe2Mcnkg4Y6",
                "compressionProgram": "cmtDvXumGCrqC1Age74AVPhSRVXJMd8PJS91L8KbNCK",
                "tokenMetadataProgram": "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s",
                "bubblegumProgram": "BGUMAp9Gq7iTEuizy4pqaxsTyUCBK68MDfK752saRPUY",
            },
            "args": {
                "metadata": {
                    "name": metadata.name,
                    "symbol": metadata.symbol,
                    "uri": metadata.uri,
                    "sellerFeeBasisPoints": metadata.seller_fee_basis_points,
                    "primarySaleHappened": metadata.primary_sale_happened,
                    "isMutable": metadata.is_mutable,
                    "editionNonce": metadata.edition_nonce,
                    "tokenStandard": metadata.token_standard,
                    "collection": metadata.collection,
                    "uses": metadata.uses,
                    "tokenProgramVersion": metadata.token_program_version,
                    "creators": metadata.creators,
                },
            },
        }

    def generate_transfer_instruction_data(
        self,
        asset_id: str,
        leaf_owner: str,
        new_leaf_owner: str,
        proof: List[str],
        root: str,
        data_hash: str,
        creator_hash: str,
        nonce: int,
        index: int,
    ) -> Dict[str, Any]:
        """
        Generate instruction data for transferring a cNFT.

        Args:
            asset_id: The asset ID of the cNFT
            leaf_owner: Current owner
            new_leaf_owner: New owner
            proof: Merkle proof
            root: Merkle root
            data_hash: Data hash of the leaf
            creator_hash: Creator hash of the leaf
            nonce: Leaf nonce
            index: Leaf index

        Returns:
            Instruction data dictionary
        """
        return {
            "instruction": "transfer",
            "accounts": {
                "treeAuthority": self.config.tree_authority,
                "leafOwner": leaf_owner,
                "leafDelegate": leaf_owner,
                "newLeafOwner": new_leaf_owner,
                "merkleTree": self.config.merkle_tree,
                "logWrapper": "noopb9bkMVfRPU8AsBHK6gQeGJX8YCzRUEe2Mcnkg4Y6",
                "compressionProgram": "cmtDvXumGCrqC1Age74AVPhSRVXJMd8PJS91L8KbNCK",
                "bubblegumProgram": "BGUMAp9Gq7iTEuizy4pqaxsTyUCBK68MDfK752saRPUY",
            },
            "args": {
                "root": root,
                "dataHash": data_hash,
                "creatorHash": creator_hash,
                "nonce": nonce,
                "index": index,
            },
            "remainingAccounts": [{"pubkey": p, "isSigner": False, "isWritable": False} for p in proof],
        }

    @staticmethod
    def calculate_data_hash(metadata: CNFTMetadata) -> str:
        """Calculate the data hash for a cNFT metadata."""
        # Simplified hash calculation - actual implementation uses Keccak256
        data = json.dumps({
            "name": metadata.name,
            "symbol": metadata.symbol,
            "uri": metadata.uri,
            "sellerFeeBasisPoints": metadata.seller_fee_basis_points,
        }, sort_keys=True)
        return hashlib.sha256(data.encode()).hexdigest()

    @staticmethod
    def calculate_creator_hash(creators: List[Dict[str, Any]]) -> str:
        """Calculate the creator hash for a cNFT."""
        data = json.dumps(creators, sort_keys=True)
        return hashlib.sha256(data.encode()).hexdigest()


# TypeScript/JavaScript code generation for actual minting
def generate_typescript_mint_code(
    metadata_uri: str,
    leaf_owner: str,
    merkle_tree: str,
    collection_mint: Optional[str] = None,
    robot_id: str = "ROBOT-001",
) -> str:
    """
    Generate TypeScript code for minting a passport cNFT.

    This generates code that can be run with the Metaplex JS SDK.

    Args:
        metadata_uri: URI of the uploaded metadata JSON
        leaf_owner: Owner's wallet address
        merkle_tree: Merkle tree address
        collection_mint: Optional collection mint
        robot_id: Robot ID for naming

    Returns:
        TypeScript code string
    """
    if collection_mint:
        return f'''// Mint Robot Passport cNFT to Collection
import {{ createUmi }} from "@metaplex-foundation/umi-bundle-defaults";
import {{
  mintToCollectionV1,
  mplBubblegum,
}} from "@metaplex-foundation/mpl-bubblegum";
import {{ keypairIdentity }} from "@metaplex-foundation/umi";
import {{ publicKey }} from "@metaplex-foundation/umi";

async function mintRobotPassport() {{
  // Initialize Umi
  const umi = createUmi("https://api.devnet.solana.com")
    .use(mplBubblegum());

  // Load your keypair (adjust path as needed)
  // const keypair = await loadKeypairFromFile("~/.config/solana/id.json");
  // umi.use(keypairIdentity(keypair));

  const merkleTree = publicKey("{merkle_tree}");
  const leafOwner = publicKey("{leaf_owner}");
  const collectionMint = publicKey("{collection_mint}");

  // Mint to collection
  const {{ signature }} = await mintToCollectionV1(umi, {{
    leafOwner,
    merkleTree,
    collectionMint,
    metadata: {{
      name: "Robot Passport: {robot_id}",
      uri: "{metadata_uri}",
      sellerFeeBasisPoints: 500,
      collection: {{ key: collectionMint, verified: false }},
      creators: [
        {{ address: umi.identity.publicKey, verified: false, share: 100 }},
      ],
    }},
  }}).sendAndConfirm(umi, {{ confirm: {{ commitment: "finalized" }} }});

  console.log("Minted passport with signature:", signature);

  // Get the asset ID
  const leaf = await parseLeafFromMintToCollectionV1Transaction(umi, signature);
  console.log("Asset ID:", leaf.id);
}}

mintRobotPassport().catch(console.error);
'''
    else:
        return f'''// Mint Robot Passport cNFT (without collection)
import {{ createUmi }} from "@metaplex-foundation/umi-bundle-defaults";
import {{
  mintV1,
  mplBubblegum,
  parseLeafFromMintV1Transaction,
  findLeafAssetIdPda,
}} from "@metaplex-foundation/mpl-bubblegum";
import {{ keypairIdentity, none }} from "@metaplex-foundation/umi";
import {{ publicKey }} from "@metaplex-foundation/umi";

async function mintRobotPassport() {{
  // Initialize Umi
  const umi = createUmi("https://api.devnet.solana.com")
    .use(mplBubblegum());

  // Load your keypair (adjust path as needed)
  // const keypair = await loadKeypairFromFile("~/.config/solana/id.json");
  // umi.use(keypairIdentity(keypair));

  const merkleTree = publicKey("{merkle_tree}");
  const leafOwner = publicKey("{leaf_owner}");

  // Mint cNFT
  const {{ signature }} = await mintV1(umi, {{
    leafOwner,
    merkleTree,
    metadata: {{
      name: "Robot Passport: {robot_id}",
      uri: "{metadata_uri}",
      sellerFeeBasisPoints: 500,
      collection: none(),
      creators: [
        {{ address: umi.identity.publicKey, verified: false, share: 100 }},
      ],
    }},
  }}).sendAndConfirm(umi, {{ confirm: {{ commitment: "finalized" }} }});

  console.log("Minted passport with signature:", signature);

  // Get the asset ID from the transaction
  const leaf = await parseLeafFromMintV1Transaction(umi, signature);
  const assetId = findLeafAssetIdPda(umi, {{ merkleTree, leafIndex: leaf.nonce }});
  console.log("Asset ID:", assetId);
}}

mintRobotPassport().catch(console.error);
'''


def generate_create_tree_code(
    max_depth: int = 14,
    max_buffer_size: int = 64,
    canopy_depth: int = 0,
    is_public: bool = True,
) -> str:
    """
    Generate TypeScript code for creating a Merkle tree for cNFTs.

    Args:
        max_depth: Maximum depth of the tree (determines max NFTs)
        max_buffer_size: Buffer size for concurrent operations
        canopy_depth: Depth of on-chain canopy
        is_public: Whether tree is public (anyone can mint)

    Returns:
        TypeScript code string
    """
    max_nfts = 2 ** max_depth
    return f'''// Create Merkle Tree for Robot Passports
import {{ createUmi }} from "@metaplex-foundation/umi-bundle-defaults";
import {{
  createTree,
  mplBubblegum,
}} from "@metaplex-foundation/mpl-bubblegum";
import {{ generateSigner, keypairIdentity }} from "@metaplex-foundation/umi";

async function createMerkleTree() {{
  // Initialize Umi
  const umi = createUmi("https://api.devnet.solana.com")
    .use(mplBubblegum());

  // Load your keypair
  // const keypair = await loadKeypairFromFile("~/.config/solana/id.json");
  // umi.use(keypairIdentity(keypair));

  // Generate a new merkle tree keypair
  const merkleTree = generateSigner(umi);

  // Create the tree
  // Max depth {max_depth} = up to {max_nfts:,} NFTs
  const builder = await createTree(umi, {{
    merkleTree,
    maxDepth: {max_depth},
    maxBufferSize: {max_buffer_size},
    canopyDepth: {canopy_depth},
    public: {str(is_public).lower()},
  }});

  await builder.sendAndConfirm(umi);

  console.log("Created Merkle Tree:", merkleTree.publicKey);
  console.log("Max NFTs:", {max_nfts:,});
  console.log("Public:", {str(is_public).lower()});

  return merkleTree.publicKey;
}}

createMerkleTree().catch(console.error);
'''


def generate_transfer_code(
    asset_id: str,
    current_owner: str,
    new_owner: str,
    merkle_tree: str,
) -> str:
    """
    Generate TypeScript code for transferring a passport cNFT.

    Args:
        asset_id: The asset ID to transfer
        current_owner: Current owner's address
        new_owner: New owner's address
        merkle_tree: Merkle tree address

    Returns:
        TypeScript code string
    """
    return f'''// Transfer Robot Passport cNFT
import {{ createUmi }} from "@metaplex-foundation/umi-bundle-defaults";
import {{
  transfer,
  getAssetWithProof,
  mplBubblegum,
}} from "@metaplex-foundation/mpl-bubblegum";
import {{ keypairIdentity }} from "@metaplex-foundation/umi";
import {{ publicKey }} from "@metaplex-foundation/umi";

async function transferPassport() {{
  // Initialize Umi with DAS API support
  const umi = createUmi("https://api.devnet.solana.com")
    .use(mplBubblegum());

  // Load owner's keypair
  // const keypair = await loadKeypairFromFile("~/.config/solana/id.json");
  // umi.use(keypairIdentity(keypair));

  const assetId = publicKey("{asset_id}");
  const currentOwner = publicKey("{current_owner}");
  const newOwner = publicKey("{new_owner}");

  // Fetch asset with proof (uses DAS API)
  const assetWithProof = await getAssetWithProof(umi, assetId, {{
    truncateCanopy: true,
  }});

  // Transfer the cNFT
  const {{ signature }} = await transfer(umi, {{
    ...assetWithProof,
    leafOwner: currentOwner,
    newLeafOwner: newOwner,
  }}).sendAndConfirm(umi);

  console.log("Transferred passport with signature:", signature);
  console.log("New owner:", newOwner);
}}

transferPassport().catch(console.error);
'''


__all__ = [
    "PassportMinter",
    "MintConfig",
    "CNFTMetadata",
    "MintResult",
    "generate_typescript_mint_code",
    "generate_create_tree_code",
    "generate_transfer_code",
]
