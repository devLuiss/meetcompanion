/**
 * Serviço para interação com a API Gemini
 */

/**
 * Envia uma requisição para a API Gemini para análise de texto e/ou imagem
 * @param {string} prompt - Texto do prompt a ser enviado
 * @param {string|null} imageData - URL da imagem ou Data URL
 * @param {string} geminiApiKey - Chave da API Gemini
 * @param {string|null} cloudflareAccount - Hash da conta Cloudflare para upload de imagens
 * @returns {Promise<string>} - Texto da resposta
 */
export async function callGemini(prompt, imageData, geminiApiKey, cloudflareAccount) {
  if (!geminiApiKey) {
    throw new Error('Gemini API key not set. Please add your Gemini API key in Settings.');
  }

  if (!imageData) {
    throw new Error('Please capture a screenshot (⌘+S) or paste an image (⌘+V) to analyze with Gemini.');
  }

  try {
    console.log("[Gemini API Call] Model: gemini-2.0-flash, Prompt:", prompt);

    let imageContent;

    if (imageData.startsWith('data:')) {
      if (cloudflareAccount) {
        try {
          const formData = new FormData();
          const blob = await (await fetch(imageData)).blob();
          formData.append('file', blob);

          const cfResponse = await fetch(`https://upload.imagedelivery.net/${cloudflareAccount}`, {
            method: 'POST',
            body: formData,
          });

          if (!cfResponse.ok) {
            throw new Error('Failed to upload image to Cloudflare');
          }

          const cfData = await cfResponse.json();
          const cloudflareUrl = cfData.result.variants[0];
          imageContent = {
            mimeType: blob.type,
            data: null,
            fileUri: cloudflareUrl
          };
        } catch (err) {
          console.error('Error uploading to Cloudflare:', err);
          const base64Data = imageData.split(',')[1];
          imageContent = {
            mimeType: imageData.split(';')[0].split(':')[1],
            data: base64Data
          };
        }
      } else {
        const base64Data = imageData.split(',')[1];
        imageContent = {
          mimeType: imageData.split(';')[0].split(':')[1],
          data: base64Data
        };
      }
    } else {
      imageContent = {
        mimeType: "image/jpeg",
        data: null,
        fileUri: imageData
      };
    }

    const geminiPayload = {
      contents: [
        {
          parts: [
            {
              text: prompt || "Analyze this image and explain what's in it."
            },
            {
              inline_data: imageContent
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.4,
        topK: 32,
        topP: 1,
        maxOutputTokens: 4096,
      }
    };

    const apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
    const geminiResponse = await fetch(`${apiUrl}?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(geminiPayload)
    });

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.json();
      throw new Error(errorData.error?.message || 'Error calling Gemini API');
    }

    const geminiData = await geminiResponse.json();

    if (geminiData.candidates && geminiData.candidates.length > 0 &&
        geminiData.candidates[0].content && geminiData.candidates[0].content.parts) {
      return geminiData.candidates[0].content.parts[0].text;
    } else {
      throw new Error('Invalid or empty response from Gemini API');
    }
  } catch (err) {
    throw err;
  }
}