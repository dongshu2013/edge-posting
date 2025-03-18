export async function authTwitter() {
  // Create the basic auth credentials string
  const credentials = `${process.env.TWITTER_API_KEY}:${process.env.TWITTER_API_SECRET}`;

  // Encode to Base64
  const encodedCredentials = btoa(credentials);

  // Create headers with Authorization
  const headers = new Headers({});
  headers.set("Authorization", `Basic ${encodedCredentials}`);

  const formData = new URLSearchParams();
  formData.append("grant_type", "client_credentials");

  const response = await fetch("https://api.x.com/oauth2/token", {
    method: "POST",
    headers,
    body: formData,
  });

  const data = await response.json();
  console.log("data", data);

  return `${data.token_type} ${data.access_token}`;
}
