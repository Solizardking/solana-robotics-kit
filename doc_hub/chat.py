"""
Chat with Docs using NVIDIA Nemotron reasoning models
"""

import os
from typing import List, Dict, Any, Optional
from openai import OpenAI
from doc_hub.retriever import DocumentRetriever


class ChatWithDocs:
    """Conversational interface for documentation Q&A"""

    def __init__(
        self,
        llm: str = "nvidia/nemotron-3-nano-30b-a3b",
        retriever: Optional[DocumentRetriever] = None,
        reasoning_budget: int = 16384,
        api_key: Optional[str] = None
    ):
        self.llm = llm
        self.retriever = retriever or DocumentRetriever()
        self.reasoning_budget = reasoning_budget

        self.client = OpenAI(
            base_url="https://integrate.api.nvidia.com/v1",
            api_key=api_key or os.getenv("NVIDIA_API_KEY")
        )

        self.conversation_history = []

    def query(
        self,
        question: str,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        stream: bool = False,
        top_k_docs: int = 5
    ) -> Dict[str, Any]:
        """
        Query documentation with context-aware RAG

        Args:
            question: User question
            conversation_history: Previous conversation turns
            stream: Whether to stream the response
            top_k_docs: Number of documents to retrieve

        Returns:
            Response with answer, reasoning, and sources
        """

        # Retrieve relevant documents
        retrieved_docs = self.retriever.search(
            query=question,
            top_k=top_k_docs,
            use_reranking=True
        )

        # Build context from retrieved documents
        context = self._build_context(retrieved_docs)

        # Build system prompt
        system_prompt = f"""You are an expert assistant for the Solana Automation documentation.
You have access to the following documentation context:

{context}

Your task is to answer the user's question accurately based on this context.
- Cite specific sources with file paths and sections
- If you're not sure, say so
- Provide code examples when relevant
- Be concise but thorough

Always think through your reasoning before answering."""

        # Build messages
        messages = [{"role": "system", "content": system_prompt}]

        # Add conversation history
        if conversation_history:
            messages.extend(conversation_history)

        # Add current question
        messages.append({"role": "user", "content": question})

        # Get response with reasoning
        if stream:
            return self._stream_response(messages, retrieved_docs)
        else:
            return self._get_response(messages, retrieved_docs)

    def _build_context(self, documents: List[Dict[str, Any]]) -> str:
        """Build context string from retrieved documents"""

        context_parts = []

        for i, doc in enumerate(documents, 1):
            source = doc.get("source", "unknown")
            content = doc.get("content", "")
            score = doc.get("score", 0)

            context_parts.append(
                f"[Document {i}] (Source: {source}, Relevance: {score:.2f})\n"
                f"{content}\n"
            )

        return "\n---\n".join(context_parts)

    def _get_response(
        self,
        messages: List[Dict[str, str]],
        sources: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Get non-streaming response"""

        # Call LLM with reasoning
        response = self.client.chat.completions.create(
            model=self.llm,
            messages=messages,
            temperature=0.1,
            top_p=1,
            max_tokens=4096,
            extra_body={
                "reasoning_budget": self.reasoning_budget,
                "chat_template_kwargs": {"enable_thinking": True}
            }
        )

        # Extract answer and reasoning
        choice = response.choices[0]
        answer = choice.message.content

        # Extract reasoning if available
        reasoning = getattr(choice.message, "reasoning_content", None)

        # Compute confidence based on source relevance
        avg_score = sum(s.get("score", 0) for s in sources) / len(sources) if sources else 0

        return {
            "answer": answer,
            "reasoning": reasoning,
            "sources": [
                {
                    "source": s.get("source"),
                    "relevance": s.get("score"),
                    "content_preview": s.get("content", "")[:200] + "..."
                }
                for s in sources
            ],
            "confidence": float(avg_score),
            "model": self.llm
        }

    def _stream_response(
        self,
        messages: List[Dict[str, str]],
        sources: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Stream response with reasoning"""

        stream = self.client.chat.completions.create(
            model=self.llm,
            messages=messages,
            temperature=0.1,
            top_p=1,
            max_tokens=4096,
            extra_body={
                "reasoning_budget": self.reasoning_budget,
                "chat_template_kwargs": {"enable_thinking": True}
            },
            stream=True
        )

        reasoning_parts = []
        answer_parts = []

        for chunk in stream:
            # Extract reasoning
            reasoning = getattr(chunk.choices[0].delta, "reasoning_content", None)
            if reasoning:
                reasoning_parts.append(reasoning)
                yield {"type": "reasoning", "content": reasoning}

            # Extract answer
            if chunk.choices[0].delta.content is not None:
                answer_parts.append(chunk.choices[0].delta.content)
                yield {"type": "answer", "content": chunk.choices[0].delta.content}

        # Final response
        yield {
            "type": "complete",
            "reasoning": "".join(reasoning_parts),
            "answer": "".join(answer_parts),
            "sources": [s.get("source") for s in sources]
        }

    def chat(
        self,
        message: str,
        session_id: Optional[str] = None,
        clear_history: bool = False
    ) -> Dict[str, Any]:
        """
        Interactive chat with conversation history

        Args:
            message: User message
            session_id: Optional session identifier
            clear_history: Whether to clear conversation history

        Returns:
            Response with full conversation context
        """

        if clear_history:
            self.conversation_history = []

        # Get response
        response = self.query(
            question=message,
            conversation_history=self.conversation_history
        )

        # Update conversation history
        self.conversation_history.append({
            "role": "user",
            "content": message
        })
        self.conversation_history.append({
            "role": "assistant",
            "content": response["answer"]
        })

        # Keep only last 10 turns
        if len(self.conversation_history) > 20:
            self.conversation_history = self.conversation_history[-20:]

        return response

    def suggest_followups(
        self,
        last_question: str,
        last_answer: str
    ) -> List[str]:
        """Suggest follow-up questions"""

        prompt = f"""Based on this Q&A exchange, suggest 3 relevant follow-up questions:

Question: {last_question}
Answer: {last_answer}

Suggest 3 follow-up questions that would help the user learn more.
Return just the questions, one per line."""

        response = self.client.chat.completions.create(
            model=self.llm,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=200
        )

        suggestions = response.choices[0].message.content.strip().split('\n')
        return [s.strip('- ').strip() for s in suggestions if s.strip()]
