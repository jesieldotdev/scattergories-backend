import dotenv from 'dotenv'
interface Parts{
    parts: {
        text: string
    }[]
}

interface AiPostData{
    contents: Parts[]
}


  
export interface AiResponse{
    candidates: {
        content: {
            parts: Parts[],
            model: string
        }
    }
}

dotenv.config();
const API_KEY = process.env.GOOGLE_STUDIO_AI_KEY || '';
const API_URL = process.env.GOOGLE_STUDIO_AI_URL || '';


export function generateResponseFromAi(res: string) {
    const data = {
        "contents": [
            {
                "parts": [
                    {
                        "text": res
                    }
                ]
            }
        ]
    } as AiPostData

    return fetch(`${API_URL}?key=${API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then((response) => {
        if (!response.ok) throw new Error("Erro na requisição");
        return response.json() as Promise<AiResponse>;
      })
      .catch((error) => console.log(error));
  }