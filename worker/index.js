const worker = {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/") {
      url.pathname = "/n8Prompt.html";
      return env.ASSETS.fetch(new Request(url, request));
    }
    if (url.pathname === "/funpromptz") {
      url.pathname = "/funPromptz.html";
      return env.ASSETS.fetch(new Request(url, request));
    }
    return env.ASSETS.fetch(request);
  }
};

export default worker;
