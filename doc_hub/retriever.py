"""
Document Retriever using NVIDIA NeMo Retriever models
"""

import os
import numpy as np
from typing import List, Dict, Any, Optional
from openai import OpenAI


class DocumentRetriever:
    """Semantic search and re-ranking for documents"""

    def __init__(
        self,
        embedding_model: str = "nvidia/llama-3.2-nv-embedqa-1b-v2",
        rerank_model: str = "nvidia/llama-3.2-nv-rerankqa-1b-v2",
        vector_db: Optional[str] = None,
        api_key: Optional[str] = None
    ):
        self.embedding_model = embedding_model
        self.rerank_model = rerank_model
        self.vector_db = vector_db

        self.client = OpenAI(
            base_url="https://integrate.api.nvidia.com/v1",
            api_key=api_key or os.getenv("NVIDIA_API_KEY")
        )

        # In-memory vector store (replace with Milvus/Weaviate in production)
        self.vectors = []
        self.documents = []

    def embed_text(self, text: str) -> List[float]:
        """Generate embedding for text"""

        response = self.client.embeddings.create(
            input=[text],
            model=self.embedding_model
        )

        return response.data[0].embedding

    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for batch of texts"""

        response = self.client.embeddings.create(
            input=texts,
            model=self.embedding_model
        )

        return [item.embedding for item in response.data]

    def add_documents(self, documents: List[Dict[str, Any]]):
        """
        Add documents to vector store

        Args:
            documents: List of document dicts with 'text' and 'metadata' keys
        """

        # Extract texts
        texts = [doc["text"] for doc in documents]

        # Generate embeddings in batches
        batch_size = 32
        all_embeddings = []

        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            embeddings = self.embed_batch(batch)
            all_embeddings.extend(embeddings)

        # Store vectors and documents
        self.vectors = np.array(all_embeddings)
        self.documents = documents

        print(f"Added {len(documents)} documents to vector store")

    def search(
        self,
        query: str,
        top_k: int = 5,
        filters: Optional[Dict[str, Any]] = None,
        use_reranking: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Search documents with semantic understanding

        Args:
            query: Search query
            top_k: Number of results to return
            filters: Optional metadata filters
            use_reranking: Whether to use re-ranking

        Returns:
            List of search results with scores
        """

        # Generate query embedding
        query_embedding = np.array(self.embed_text(query))

        # Compute cosine similarity
        similarities = np.dot(self.vectors, query_embedding) / (
            np.linalg.norm(self.vectors, axis=1) * np.linalg.norm(query_embedding)
        )

        # Get top-k candidates (before reranking)
        top_k_initial = top_k * 2 if use_reranking else top_k
        top_indices = np.argsort(similarities)[::-1][:top_k_initial]

        # Filter by metadata
        candidates = []
        for idx in top_indices:
            doc = self.documents[idx]

            # Apply filters
            if filters:
                if not all(
                    doc.get("metadata", {}).get(k) == v
                    for k, v in filters.items()
                ):
                    continue

            candidates.append({
                "content": doc["text"],
                "score": float(similarities[idx]),
                "metadata": doc.get("metadata", {}),
                "index": int(idx)
            })

        # Re-rank if enabled
        if use_reranking and len(candidates) > 0:
            candidates = self._rerank(query, candidates, top_k)
        else:
            candidates = candidates[:top_k]

        # Add source information
        for result in candidates:
            metadata = result.get("metadata", {})
            file_path = metadata.get("file", "unknown")
            section = metadata.get("section", "")

            result["source"] = f"{file_path}"
            if section:
                result["source"] += f" (Section: {section})"

        return candidates

    def _rerank(
        self,
        query: str,
        candidates: List[Dict[str, Any]],
        top_k: int
    ) -> List[Dict[str, Any]]:
        """
        Re-rank candidates using reranking model

        Args:
            query: Original query
            candidates: Initial search results
            top_k: Number of results to return

        Returns:
            Re-ranked results
        """

        # Prepare reranking request
        # Note: This is a simplified version. Real implementation would use
        # the nvidia/llama-3.2-nv-rerankqa-1b-v2 model for reranking

        # For now, we'll use a simple LLM-based reranking
        reranked = []

        for candidate in candidates:
            # Score how relevant the candidate is to the query
            relevance_prompt = f"""
Query: {query}

Document: {candidate['content'][:500]}

On a scale of 0-1, how relevant is this document to the query?
Respond with just a number.
"""

            try:
                response = self.client.chat.completions.create(
                    model="nvidia/llama-3.1-nemotron-70b-instruct",
                    messages=[{"role": "user", "content": relevance_prompt}],
                    temperature=0,
                    max_tokens=10
                )

                relevance_score = float(response.choices[0].message.content.strip())
                candidate["rerank_score"] = relevance_score

            except:
                # If reranking fails, keep original score
                candidate["rerank_score"] = candidate["score"]

            reranked.append(candidate)

        # Sort by rerank score
        reranked.sort(key=lambda x: x["rerank_score"], reverse=True)

        return reranked[:top_k]

    def hybrid_search(
        self,
        query: str,
        top_k: int = 5,
        semantic_weight: float = 0.7,
        keyword_weight: float = 0.3
    ) -> List[Dict[str, Any]]:
        """
        Hybrid search combining semantic and keyword matching

        Args:
            query: Search query
            top_k: Number of results
            semantic_weight: Weight for semantic similarity
            keyword_weight: Weight for keyword matching

        Returns:
            Combined search results
        """

        # Semantic search
        semantic_results = self.search(query, top_k=top_k * 2, use_reranking=False)

        # Keyword search (simple TF-IDF)
        keyword_scores = {}
        query_terms = set(query.lower().split())

        for i, doc in enumerate(self.documents):
            content = doc["text"].lower()
            doc_terms = set(content.split())

            # Compute overlap
            overlap = len(query_terms & doc_terms)
            keyword_scores[i] = overlap / len(query_terms) if query_terms else 0

        # Combine scores
        combined_results = {}

        for result in semantic_results:
            idx = result["index"]
            semantic_score = result["score"]
            keyword_score = keyword_scores.get(idx, 0)

            combined_score = (
                semantic_weight * semantic_score +
                keyword_weight * keyword_score
            )

            combined_results[idx] = {
                **result,
                "combined_score": combined_score,
                "semantic_score": semantic_score,
                "keyword_score": keyword_score
            }

        # Sort by combined score
        sorted_results = sorted(
            combined_results.values(),
            key=lambda x: x["combined_score"],
            reverse=True
        )

        return sorted_results[:top_k]
