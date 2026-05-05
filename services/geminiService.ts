
import { GoogleGenAI, Type } from "@google/genai";
import { MaintenanceTicket, DeviceType, MeetingAgenda } from "../types";

const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY environment variable is missing");
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeIssueImage = async (
  base64Image: string,
  mimeType: string
): Promise<{
  deviceType: DeviceType;
  issueDescription: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  suggestedAction: string;
  technicalNotes: string;
}> => {
  const ai = getAIClient();

  const schema = {
    type: Type.OBJECT,
    properties: {
      deviceType: {
        type: Type.STRING,
        enum: ['TICKET_MACHINE', 'CCTV', 'CHARGER', 'OTHER'],
        description: "The type of electronic device identified in the image.",
      },
      issueDescription: {
        type: Type.STRING,
        description: "A concise description of the visible damage or issue in Thai language.",
      },
      severity: {
        type: Type.STRING,
        enum: ['LOW', 'MEDIUM', 'HIGH'],
        description: "The estimated urgency of the repair.",
      },
      suggestedAction: {
        type: Type.STRING,
        description: "Recommended immediate action for the user or technician in Thai language.",
      },
      technicalNotes: {
        type: Type.STRING,
        description: "Technical details inferred from the image (model, probable cause) in Thai language.",
      },
    },
    required: ["deviceType", "issueDescription", "severity", "suggestedAction", "technicalNotes"],
  };

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: mimeType,
            data: base64Image,
          },
        },
        {
          text: "You are an expert electronics maintenance technician. Analyze this image of a broken or malfunctioning device. Identify if it is an Automatic Ticket Machine, CCTV Camera, EV/Device Charger, or Other. Assess the damage and provide a technical report. IMPORTANT: Provide all text descriptions (issueDescription, suggestedAction, technicalNotes) in Thai Language.",
        },
      ],
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: schema,
      systemInstruction: "Prioritize safety and accuracy. If the image is unclear, default to 'OTHER' and 'LOW' severity. Output Thai language for descriptive fields.",
    },
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");
  return JSON.parse(text);
};

export const checkApiKeySelection = async (): Promise<boolean> => {
  if (typeof window !== 'undefined' && (window as any).aistudio && (window as any).aistudio.hasSelectedApiKey) {
    return await (window as any).aistudio.hasSelectedApiKey();
  }
  return true;
};

export const promptApiKeySelection = async (): Promise<void> => {
  if (typeof window !== 'undefined' && (window as any).aistudio && (window as any).aistudio.openSelectKey) {
    await (window as any).aistudio.openSelectKey();
  }
};

export const generateVeoVideo = async (image: string, prompt: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: prompt || "Animate this image naturally.",
    image: {
      imageBytes: image,
      mimeType: 'image/png',
    },
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: '16:9'
    }
  });

  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 10000));
    operation = await ai.operations.getVideosOperation({operation: operation});
  }

  const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!videoUri) {
    throw new Error("Video generation failed or no URI returned.");
  }
  return videoUri;
};

export const getVideoDownloadUrl = (uri: string): string => {
  return `${uri}&key=${process.env.API_KEY}`;
};

// Implemented missing generateMeetingAgenda function
/**
 * Analyzes a document (PDF or Image) to generate a structured meeting agenda in Thai.
 */
export const generateMeetingAgenda = async (
  base64Data: string,
  mimeType: string
): Promise<any> => {
  const ai = getAIClient();

  const schema = {
    type: Type.OBJECT,
    properties: {
      title: {
        type: Type.STRING,
        description: "Meeting title in Thai",
      },
      date: {
        type: Type.STRING,
        description: "Meeting date",
      },
      summary: {
        type: Type.STRING,
        description: "Meeting overview in Thai",
      },
      stakeholders: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "Participants or stakeholders",
      },
      items: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            time: { type: Type.STRING },
            duration: { type: Type.STRING },
            topic: { type: Type.STRING, description: "Agenda topic in Thai" },
            description: { type: Type.STRING, description: "Agenda details in Thai" },
            owner: { type: Type.STRING, description: "Responsible person" },
          },
          required: ["time", "duration", "topic", "description", "owner"],
        },
      },
    },
    required: ["title", "date", "summary", "stakeholders", "items"],
  };

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: mimeType,
            data: base64Data,
          },
        },
        {
          text: "Extract and structure a meeting agenda from this document. Provide all Thai language for descriptive fields.",
        },
      ],
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: schema,
      systemInstruction: "You are an expert at extracting meeting agendas from various documents. Output must be in Thai.",
    },
  });

  const text = response.text;
  if (!text) throw new Error("Failed to generate agenda from Gemini");
  return JSON.parse(text);
};
