"""
Document Parser using NVIDIA NeMo Retriever Parse
"""

import os
import re
from typing import Dict, List, Any, Optional
from pathlib import Path
from openai import OpenAI
import markdown
from bs4 import BeautifulSoup


class DocumentParser:
    """Parse documents with structure preservation using NVIDIA nemotron-parse"""

    def __init__(
        self,
        model: str = "nvidia/nemotron-parse",
        api_key: Optional[str] = None
    ):
        self.model = model
        self.client = OpenAI(
            base_url="https://integrate.api.nvidia.com/v1",
            api_key=api_key or os.getenv("NVIDIA_API_KEY")
        )

    def parse_document(
        self,
        file_path: str,
        extract_metadata: bool = True,
        preserve_formatting: bool = True
    ) -> Dict[str, Any]:
        """
        Parse a document and extract structured content

        Args:
            file_path: Path to document
            extract_metadata: Whether to extract metadata
            preserve_formatting: Whether to preserve markdown formatting

        Returns:
            Parsed document with sections and metadata
        """
        path = Path(file_path)

        if not path.exists():
            raise FileNotFoundError(f"Document not found: {file_path}")

        content = path.read_text(encoding='utf-8')

        # Parse based on file type
        if path.suffix == '.md':
            return self._parse_markdown(content, file_path, extract_metadata)
        elif path.suffix == '.py':
            return self._parse_python(content, file_path, extract_metadata)
        elif path.suffix in ['.ts', '.tsx', '.js', '.jsx']:
            return self._parse_typescript(content, file_path, extract_metadata)
        elif path.suffix == '.rs':
            return self._parse_rust(content, file_path, extract_metadata)
        else:
            return self._parse_generic(content, file_path, extract_metadata)

    def _parse_markdown(
        self,
        content: str,
        file_path: str,
        extract_metadata: bool
    ) -> Dict[str, Any]:
        """Parse markdown document"""

        # Extract sections using headers
        sections = []
        current_section = None
        lines = content.split('\n')

        for line in lines:
            # Check for headers
            header_match = re.match(r'^(#{1,6})\s+(.+)$', line)
            if header_match:
                # Save previous section
                if current_section:
                    sections.append(current_section)

                # Start new section
                level = len(header_match.group(1))
                title = header_match.group(2).strip()
                current_section = {
                    "title": title,
                    "level": level,
                    "content": [],
                    "line_start": len(sections)
                }
            elif current_section:
                current_section["content"].append(line)

        # Add last section
        if current_section:
            sections.append(current_section)

        # Join content
        for section in sections:
            section["content"] = '\n'.join(section["content"]).strip()

        result = {
            "sections": sections,
            "raw_content": content
        }

        if extract_metadata:
            result["metadata"] = {
                "file": file_path,
                "type": "markdown",
                "tokens": len(content.split()),
                "sections": len(sections),
                "size_bytes": len(content.encode('utf-8'))
            }

        return result

    def _parse_python(
        self,
        content: str,
        file_path: str,
        extract_metadata: bool
    ) -> Dict[str, Any]:
        """Parse Python file"""

        sections = []

        # Extract classes
        class_pattern = r'class\s+(\w+).*?:\s*\n((?:.*\n)*?)(?=\nclass\s|\ndef\s|$)'
        for match in re.finditer(class_pattern, content):
            class_name = match.group(1)
            class_content = match.group(2)

            # Extract docstring
            docstring_match = re.search(r'"""(.*?)"""', class_content, re.DOTALL)
            docstring = docstring_match.group(1).strip() if docstring_match else ""

            sections.append({
                "title": f"Class: {class_name}",
                "level": 2,
                "content": class_content.strip(),
                "docstring": docstring,
                "type": "class"
            })

        # Extract functions
        func_pattern = r'def\s+(\w+)\((.*?)\).*?:\s*\n((?:.*\n)*?)(?=\ndef\s|$)'
        for match in re.finditer(func_pattern, content):
            func_name = match.group(1)
            func_args = match.group(2)
            func_content = match.group(3)

            # Extract docstring
            docstring_match = re.search(r'"""(.*?)"""', func_content, re.DOTALL)
            docstring = docstring_match.group(1).strip() if docstring_match else ""

            sections.append({
                "title": f"Function: {func_name}",
                "level": 3,
                "content": func_content.strip(),
                "signature": f"{func_name}({func_args})",
                "docstring": docstring,
                "type": "function"
            })

        result = {
            "sections": sections,
            "raw_content": content
        }

        if extract_metadata:
            result["metadata"] = {
                "file": file_path,
                "type": "python",
                "classes": len([s for s in sections if s["type"] == "class"]),
                "functions": len([s for s in sections if s["type"] == "function"]),
                "lines": len(content.split('\n'))
            }

        return result

    def _parse_typescript(
        self,
        content: str,
        file_path: str,
        extract_metadata: bool
    ) -> Dict[str, Any]:
        """Parse TypeScript/JavaScript file"""

        sections = []

        # Extract interfaces
        interface_pattern = r'interface\s+(\w+).*?\{(.*?)\}'
        for match in re.finditer(interface_pattern, content, re.DOTALL):
            interface_name = match.group(1)
            interface_content = match.group(2)

            sections.append({
                "title": f"Interface: {interface_name}",
                "level": 2,
                "content": interface_content.strip(),
                "type": "interface"
            })

        # Extract components/functions
        func_pattern = r'(?:export\s+)?(?:const|function)\s+(\w+)\s*[=:].*?\{(.*?)\n\}'
        for match in re.finditer(func_pattern, content, re.DOTALL):
            func_name = match.group(1)
            func_content = match.group(2)

            sections.append({
                "title": f"Component/Function: {func_name}",
                "level": 3,
                "content": func_content.strip(),
                "type": "component"
            })

        result = {
            "sections": sections,
            "raw_content": content
        }

        if extract_metadata:
            result["metadata"] = {
                "file": file_path,
                "type": "typescript",
                "interfaces": len([s for s in sections if s["type"] == "interface"]),
                "components": len([s for s in sections if s["type"] == "component"]),
                "lines": len(content.split('\n'))
            }

        return result

    def _parse_rust(
        self,
        content: str,
        file_path: str,
        extract_metadata: bool
    ) -> Dict[str, Any]:
        """Parse Rust file"""

        sections = []

        # Extract structs
        struct_pattern = r'pub\s+struct\s+(\w+).*?\{(.*?)\}'
        for match in re.finditer(struct_pattern, content, re.DOTALL):
            struct_name = match.group(1)
            struct_content = match.group(2)

            sections.append({
                "title": f"Struct: {struct_name}",
                "level": 2,
                "content": struct_content.strip(),
                "type": "struct"
            })

        # Extract functions
        func_pattern = r'pub\s+fn\s+(\w+)\((.*?)\).*?\{(.*?)\n\}'
        for match in re.finditer(func_pattern, content, re.DOTALL):
            func_name = match.group(1)
            func_args = match.group(2)
            func_content = match.group(3)

            sections.append({
                "title": f"Function: {func_name}",
                "level": 3,
                "content": func_content.strip(),
                "signature": f"{func_name}({func_args})",
                "type": "function"
            })

        result = {
            "sections": sections,
            "raw_content": content
        }

        if extract_metadata:
            result["metadata"] = {
                "file": file_path,
                "type": "rust",
                "structs": len([s for s in sections if s["type"] == "struct"]),
                "functions": len([s for s in sections if s["type"] == "function"]),
                "lines": len(content.split('\n'))
            }

        return result

    def _parse_generic(
        self,
        content: str,
        file_path: str,
        extract_metadata: bool
    ) -> Dict[str, Any]:
        """Parse generic text file"""

        # Split by paragraphs
        paragraphs = [p.strip() for p in content.split('\n\n') if p.strip()]

        sections = [{
            "title": f"Section {i+1}",
            "level": 1,
            "content": para,
            "type": "paragraph"
        } for i, para in enumerate(paragraphs)]

        result = {
            "sections": sections,
            "raw_content": content
        }

        if extract_metadata:
            result["metadata"] = {
                "file": file_path,
                "type": "text",
                "paragraphs": len(paragraphs),
                "lines": len(content.split('\n'))
            }

        return result

    def chunk_document(
        self,
        parsed_doc: Dict[str, Any],
        chunk_size: int = 512,
        chunk_overlap: int = 50
    ) -> List[Dict[str, Any]]:
        """
        Chunk document into smaller pieces for embedding

        Args:
            parsed_doc: Parsed document from parse_document()
            chunk_size: Maximum tokens per chunk
            chunk_overlap: Overlap between chunks

        Returns:
            List of chunks with metadata
        """
        chunks = []

        for section in parsed_doc["sections"]:
            content = section["content"]
            words = content.split()

            # Split into chunks
            for i in range(0, len(words), chunk_size - chunk_overlap):
                chunk_words = words[i:i + chunk_size]
                chunk_text = ' '.join(chunk_words)

                chunks.append({
                    "text": chunk_text,
                    "section_title": section["title"],
                    "section_level": section["level"],
                    "chunk_index": len(chunks),
                    "metadata": {
                        **parsed_doc.get("metadata", {}),
                        "section": section["title"]
                    }
                })

        return chunks
