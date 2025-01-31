import express from "express";
import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "@octokit/core";

const app = express();

function updateUrl(url, newAccessToken) {
  const parsedUrl = new URL(url);

  // 判断路由模式
  const routerMode = parsedUrl.hash ? "hash" : "history";

  // 创建新的 URL 对象
  let newUrl;
  if (routerMode === "hash") {
    // 解析 hash 部分的查询参数
    const hashUrl = new URL(parsedUrl.origin + parsedUrl.hash.substring(1));
    hashUrl.searchParams.set("access_token", newAccessToken);
    newUrl = `${parsedUrl.origin}${parsedUrl.pathname}#${hashUrl.pathname}${hashUrl.search}`;
  } else {
    // 解析 search 部分的查询参数
    parsedUrl.searchParams.set("access_token", newAccessToken);
    newUrl = parsedUrl.toString();
  }

  return newUrl;
}

app.get("/api/auth", async (req, res) => {
  const code = req.query.code;
  let requestUrl = req.query.state;

  if (!code) return res.status(400).send("No code provided");

  const client_secret = process.env.GITHUB_CLIENT_SECRET;
  const private_key = process.env.GITHUB_PRIVATE_KEY;

  try {
    // 使用 @octokit/auth-app 进行身份验证
    const auth = createAppAuth({
      appId: "1102849",
      privateKey: private_key,
      clientId: "Iv23liKlkmkQ3Tc1M679",
      clientSecret: client_secret,
    });

    const { token } = await auth({
      type: "oauth-user",
      code
    });

    if (!token) {
      console.error("GitHub 未返回访问令牌");
      return res
        .status(500)
        .send({ message: "No access token returned from GitHub." });
    }

    // 解析 requestUrl 并移除 access_token 参数
    // const url = new URL(requestUrl);
    // url.searchParams.delete("access_token");

    // // 添加新的访问令牌
    // url.searchParams.append("access_token", token);

    const url = updateUrl(requestUrl, token);

    // requestUrl = url.toString();

    // Redirect back to your frontend app with the access token in the URL
    res.redirect(url);
  } catch (error) {
    console.error("认证未知错误：", error);
    res.status(500).send({
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

// 如果需要在本地运行，可以取消注释以下代码
// app.listen(52665, () => {
//   console.log('Server is running on http://localhost:52665');
// });

export default app;
