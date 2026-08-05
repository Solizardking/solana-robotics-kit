import axios from "axios";

const PINECONE_HOST = "https://prod-1-data.ke.pinecone.io";
const ASSISTANT_NAME = "solanarobotics";

interface PineconeChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface PineconeChatResponse {
  id: string;
  finish_reason: string;
  message: {
    role: string;
    content: string;
  };
  citations?: Array<{
    position: number;
    references: Array<{
      file: { name: string; id: string };
      pages: number[];
    }>;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface PineconeFile {
  id: string;
  name: string;
  size: number;
  created_on: string;
  updated_on: string;
  status: string;
  percent_done?: number;
  signed_url?: string;
}

/**
 * Chat with the Pinecone assistant
 */
export async function chatWithAssistant(
  messages: PineconeChatMessage[],
  stream: boolean = false,
  model: string = "gpt-4o"
): Promise<PineconeChatResponse | null> {
  const apiKey = process.env.PINECONE_API_KEY;
  
  if (!apiKey) {
    console.warn("[Pinecone] API key not configured, returning mock response");
    return {
      id: "mock-response",
      finish_reason: "stop",
      message: {
        role: "assistant",
        content: "The Pinecone API key is not configured yet. Please add your PINECONE_API_KEY in Settings → Secrets to enable document chat. In the meantime, I can tell you that the Solana Robotics Kit is a comprehensive framework for building autonomous robots powered by NVIDIA Jetson Orin Nano and Solana blockchain. It includes AI vision models, reasoning capabilities, and on-chain payment integration."
      }
    };
  }

  try {
    const response = await axios.post(
      `${PINECONE_HOST}/assistant/chat/${ASSISTANT_NAME}`,
      {
        messages,
        stream,
        model
      },
      {
        headers: {
          "Api-Key": apiKey,
          "Content-Type": "application/json"
        }
      }
    );

    return response.data;
  } catch (error: any) {
    console.error("[Pinecone] Chat error:", error.response?.data || error.message);
    return null;
  }
}

/**
 * List files in the assistant
 */
export async function listAssistantFiles(): Promise<PineconeFile[]> {
  const apiKey = process.env.PINECONE_API_KEY;
  
  if (!apiKey) {
    console.warn("[Pinecone] API key not configured, returning mock files");
    return [
      {
        id: "mock-1",
        name: "Self_Sovereign_Physical_Agents.pdf",
        size: 2048000,
        created_on: new Date().toISOString(),
        updated_on: new Date().toISOString(),
        status: "Available"
      },
      {
        id: "mock-2",
        name: "SOLANA_ROBOTICS_KIT.md",
        size: 45000,
        created_on: new Date().toISOString(),
        updated_on: new Date().toISOString(),
        status: "Available"
      },
      {
        id: "mock-3",
        name: "SOLANA_ROBOTICS_GUIDE.md",
        size: 52000,
        created_on: new Date().toISOString(),
        updated_on: new Date().toISOString(),
        status: "Available"
      },
      {
        id: "mock-4",
        name: "SolanaOn-ChainAIProtocol.md",
        size: 38000,
        created_on: new Date().toISOString(),
        updated_on: new Date().toISOString(),
        status: "Available"
      }
    ];
  }

  try {
    const response = await axios.get(
      `${PINECONE_HOST}/assistant/files/${ASSISTANT_NAME}`,
      {
        headers: {
          "Api-Key": apiKey
        }
      }
    );

    return response.data.files || [];
  } catch (error: any) {
    console.error("[Pinecone] List files error:", error.response?.data || error.message);
    return [];
  }
}

/**
 * Upload a file to the assistant
 */
export async function uploadFileToAssistant(
  fileBuffer: Buffer,
  fileName: string
): Promise<PineconeFile | null> {
  const apiKey = process.env.PINECONE_API_KEY;
  
  if (!apiKey) {
    console.warn("[Pinecone] API key not configured");
    return null;
  }

  try {
    const FormData = (await import("form-data")).default;
    const formData = new FormData();
    formData.append("file", fileBuffer, fileName);

    const response = await axios.post(
      `${PINECONE_HOST}/assistant/files/${ASSISTANT_NAME}`,
      formData,
      {
        headers: {
          "Api-Key": apiKey,
          ...formData.getHeaders()
        }
      }
    );

    return response.data;
  } catch (error: any) {
    console.error("[Pinecone] Upload error:", error.response?.data || error.message);
    return null;
  }
}

/**
 * Delete a file from the assistant
 */
export async function deleteAssistantFile(fileId: string): Promise<boolean> {
  const apiKey = process.env.PINECONE_API_KEY;
  
  if (!apiKey) {
    console.warn("[Pinecone] API key not configured");
    return false;
  }

  try {
    await axios.delete(
      `${PINECONE_HOST}/assistant/files/${ASSISTANT_NAME}/${fileId}`,
      {
        headers: {
          "Api-Key": apiKey
        }
      }
    );

    return true;
  } catch (error: any) {
    console.error("[Pinecone] Delete error:", error.response?.data || error.message);
    return false;
  }
}

/**
 * Get file details
 */
export async function getFileDetails(fileId: string): Promise<PineconeFile | null> {
  const apiKey = process.env.PINECONE_API_KEY;
  
  if (!apiKey) {
    return null;
  }

  try {
    const response = await axios.get(
      `${PINECONE_HOST}/assistant/files/${ASSISTANT_NAME}/${fileId}`,
      {
        headers: {
          "Api-Key": apiKey
        }
      }
    );

    return response.data;
  } catch (error: any) {
    console.error("[Pinecone] Get file error:", error.response?.data || error.message);
    return null;
  }
}
