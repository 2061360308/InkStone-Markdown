const express = require("express");
const { createAppAuth } = require("@octokit/auth-app");
const { Octokit } = require("@octokit/core");
const app = express();

app.get("/api/auth", async (req, res) => {
  console.log("req：：", req);

  const code = req.query.code;

  if (!code) return res.status(400).send("No code provided");

  const client_id = process.env.GITHUB_CLIENT_ID;
  const client_secret = process.env.GITHUB_CLIENT_SECRET;

  let redirect_uri;

  // GitHub 回调地址
  if (process.env.APP_URL.endsWith("/")) {
    redirect_uri = process.env.APP_URL + "api/auth";
  } else {
    redirect_uri = process.env.APP_URL + "/api/auth";
  }

  // GitHub Pages 地址
  let pages_url = process.env.PAGES_URL;
  if (!pages_url.endsWith("/")) {
    pages_url = pages_url + "/";
  }

  try {
    // 使用 @octokit/auth-app 进行身份验证
    const auth = createAppAuth({
      clientId: client_id,
      clientSecret: client_secret,
    });

    const { token } = await auth({
      type: "oauth-user",
      code,
      redirectUrl: redirect_uri,
    });

    if (!token) {
      console.error("GitHub 未返回访问令牌");
      return res
        .status(500)
        .send({ message: "No access token returned from GitHub." });
    }

    // Redirect back to your frontend app with the access token in the URL
    res.redirect(`${pages_url}#/?access_token=${token}`);
  } catch (error) {
    console.error("认证未知错误：", error);
    res
      .status(500)
      .send({
        message: "An error occurred while trying to authenticate",
        error: error,
      });
  }
});

app.get("/api", async (req, res) => {
  res.send(
    "Your API is working properly. The GitHub auth route is at /api/auth"
  );
});

// app.listen(52665, () => {
//   console.log('Server is running on http://localhost:52665');
// });

module.exports = app;
