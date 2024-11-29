const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
  apiKey: "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",
});
const openai = new OpenAIApi(configuration);

async function generateResponse(text) {
    const response = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: text,
      temperature: 0.3,
      max_tokens: 2000,
      top_p: 1.0,
      frequency_penalty: 0.0,
      presence_penalty: 0.0,
    });
    return response.data.choices[0].text
}

async function main() {
    const result = await generateResponse("apa itu laravel?")
    console.log(result)
}
main()
