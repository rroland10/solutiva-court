import OpenAI from "openai";

const client = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export async function analyzeDispute(input: {
  title: string;
  description: string;
  category: string;
}): Promise<string> {
  if (!client) {
    return `AI analysis unavailable. Category: ${input.category}. Review evidence and contract terms for ${input.title}.`;
  }

  const response = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are a legal-tech assistant for a decentralized dispute resolution platform. Provide a concise, neutral case summary and key considerations for jurors.",
      },
      {
        role: "user",
        content: `Analyze this dispute:\nTitle: ${input.title}\nCategory: ${input.category}\nDescription: ${input.description}`,
      },
    ],
    max_tokens: 500,
  });

  return response.choices[0]?.message?.content ?? "Analysis unavailable.";
}

export async function suggestResolution(input: {
  description: string;
  votes: { choice: string; count: number }[];
}): Promise<string> {
  if (!client) {
    const leading = input.votes.sort((a, b) => b.count - a.count)[0];
    return leading
      ? `Based on jury votes, ${leading.choice} leads with ${leading.count} votes.`
      : "Insufficient voting data for AI recommendation.";
  }

  const response = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are a dispute resolution advisor. Suggest a fair resolution based on case details and jury vote distribution.",
      },
      {
        role: "user",
        content: `Case: ${input.description}\nVotes: ${JSON.stringify(input.votes)}`,
      },
    ],
    max_tokens: 300,
  });

  return response.choices[0]?.message?.content ?? "Recommendation unavailable.";
}
