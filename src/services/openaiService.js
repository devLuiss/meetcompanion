/**
 * Serviço para interação com a API OpenAI
 */

/**
 * Envia uma requisição para a API OpenAI para análise de texto e/ou imagem
 * @param {string} prompt - Texto do prompt a ser enviado
 * @param {string|null} imageData - URL da imagem ou Data URL
 * @param {string} apiKey - Chave da API OpenAI
 * @param {string|null} cloudflareAccount - Hash da conta Cloudflare para upload de imagens
 * @returns {Promise<string>} - Texto da resposta
 */
export async function callOpenAI(prompt, imageData, apiKey, cloudflareAccount) {
  if (!apiKey) {
    throw new Error('API key not set. Please add your OpenAI API key in Settings.');
  }

  if (imageData && imageData.startsWith('data:') && !cloudflareAccount) {
    throw new Error('Cloudflare account not set. Please add your Cloudflare account hash in Settings.');
  }

  if (!prompt && !imageData) {
    throw new Error('Please provide a problem description or capture a screenshot (⌘+V).');
  }

  try {
    let payload = {
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt }
          ]
        }
      ],
      max_tokens: 4096
    };

    console.log("[OpenAI API Call] Model: gpt-4o, Prompt:", prompt);

    if (imageData) {
      if (imageData.startsWith('data:')) {
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

          payload.messages[0].content.push({
            type: "image_url",
            image_url: {
              url: cloudflareUrl
            }
          });
        } catch (err) {
          console.error('Error uploading to Cloudflare:', err);
          payload.messages[0].content.push({
            type: "image_url",
            image_url: {
              url: imageData
            }
          });
        }
      } else {
        payload.messages[0].content.push({
          type: "image_url",
          image_url: {
            url: imageData
          }
        });
      }
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Error calling OpenAI API');
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (err) {
    throw err;
  }
}