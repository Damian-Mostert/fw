const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();

app.use(express.static("./static"));

const Methods = {};

app.use(express.json());

app.use("/___server", async (request, respons, next) => {
  try {
    const { action, arguments, path } = request.body;
    respons.json(await Methods[path + ".js"][action](...arguments));
  } catch (w) {
    console.warn(w);
    respons.send(w);
  }
});

app.use("/___pages/", ({ path: pathname }, response, next) => {
  try {
    function replaceHooks(str) {
      return str.replace(/@Hook/g, (match, p1, p2) => {
        return `Hooks.`;
      });
    }
    function replaceUse(str) {
      return str
        .replace(/@server_uses:/g, (match, p1, p2) => {
          return `var server_uses =`;
        })
        .replace(/@client_uses:/g, (match, p1, p2) => {
          return `var client_uses =`;
        });
    }
    const content = fs.readFileSync("./src/pages" + pathname).toString();
    response.writeHead(200, { "Content-Type": "application/javascript" });
    const [SERVER, CLIENT] = content.split('\n"client";');
    var methods;
    var client_uses;
    var server_uses;
    eval(replaceUse(SERVER));
    Methods[pathname] = methods;
    console.log(client_uses,server_uses);
    let BLD = "";
    methods && Object.keys(methods).map((key) => {
      BLD += `async function ${key}(){
        return await ServerAction('${key}')(...arguments);
      }`;
    });
    response.end(BLD + replaceHooks(CLIENT));
  } catch (e) {
    next();
  }
});

app.get("/___lectra.js", (x, response) => {
  let script = ClientSideScript.toString().substring(
    ClientSideScript.toString().indexOf("{") + 1,
    ClientSideScript.toString().length - 1
  );
  response.writeHead(200, { "Content-Type": "application/javascript" });
  response.end(script);
});

app.use(({ path: pathname }, response, next) => {
  // Ensure pathname ends with a slash if it's not the root
  if (pathname !== "/" && !pathname.endsWith("/")) {
    pathname += "/";
  }

  const fullPath = path.join(__dirname, "src", "pages", pathname, "index.js");

  if (fs.existsSync(fullPath)) {
    pathname += "index";
  } else {
    return next();
  }

  response.send(
    `<script>window.path="${pathname}"</script><body></body><script src="/___lectra.js"></script><script src="/___pages${pathname}.js"></script>`
  );
});

app.listen(8080, () => {
  console.log("Server running on http://localhost:8080");
});

function ClientSideScript() {
  //CACHE;
  var Hooks = {};
  var Effects = {};
  //BULLSHIT;
  function SERVER() {}
  function CLIENT() {}
  //TOOLS;
  function loadScript(path) {
    const scriptUrl = `${path}`; // Assuming the server sends back a script path

    return fetch(scriptUrl)
      .then((res) => res.text())
      .then((scriptContent) => {
        const script = document.createElement("script");
        script.textContent = scriptContent;
        document.head.appendChild(script);
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }

  // Example usage:
  loadScript("testAction", { param1: "value1", param2: "value2" });

  function ServerAction(key) {
    return async function (...arguments) {
      return await new Promise((Resolve) => {
        fetch("/___server", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            path: window.path,
            action: key,
            arguments: arguments,
          }),
        })
          .then((res) => res.json())
          .then((data) => {
            Resolve(data);
          });
      });
    };
  }

  function Hook(...args) {
    if (typeof args[0] === "string") {
      const [name, value] = args;
      Hooks[name] = value;
      window[name] = value;
      Update();
      return value;
    }
  }

  function Effect(callback, deps) {
    const key = callback.toString();
    Effects[key] = {
      callback,
      deps: deps.map((dep) => {
        return {
          dep,
          value: Hooks[dep],
        };
      }),
    };
  }

  function Element(name, props, children) {
    const element = document.createElement(name);

    if (typeof props === "object") {
      if (Array.isArray(props)) throw new Error("props can't be an Array.");
      Object.keys(props).forEach((key) => {
        if (key == "style") {
          if (typeof props[key] == "object") {
            Object.keys(props[key]).map((sub_key) => {
              element.style[sub_key] = props[key][sub_key];
            });
          } else {
            element.style = props[key];
          }
        } else if (key.startsWith("on") && typeof props[key] === "function") {
          element[key.toLowerCase()] = props[key];
        } else {
          element.setAttribute(key, props[key]);
        }
      });
    }

    if (Array.isArray(children)) {
      for (let child of children) {
        element.appendChild(child);
      }
    } else if (typeof children === "string") {
      element.innerHTML = children;
    }

    return element;
  }

  function StyleSheet(sheet) {
    const style = document.createElement("style");
    style.innerHTML = sheet;
    document.head.appendChild(style);
  }

  function MetaData({ title, description, icon, image }) {
    if (title) document.title = title;
    if (description) {
      const metaDesc =
        document.querySelector('meta[name="description"]') ||
        document.createElement("meta");
      metaDesc.name = "description";
      metaDesc.content = description;
      document.head.appendChild(metaDesc);
    }
    if (icon) {
      const linkIcon =
        document.querySelector('link[rel="icon"]') ||
        document.createElement("link");
      linkIcon.rel = "icon";
      linkIcon.href = icon;
      document.head.appendChild(linkIcon);
    }
    if (image) {
      const metaImg =
        document.querySelector('meta[property="og:image"]') ||
        document.createElement("meta");
      metaImg.setAttribute("property", "og:image");
      metaImg.content = image;
      document.head.appendChild(metaImg);
    }
  }

  //ENGINE
  let element;
  let getElementRoot;
  function Render(getElement) {
    if (typeof getElement == "string") {
      window.history.pushState({}, "", getElement);
      loadScript("/___pages" + getElement + "/index.js");
      return;
    }
    Object.keys(Hooks).map((key) => {
      Hook(key, Hooks[key]);
    });
    getElementRoot = getElement;
    element = getElement();
    document.body.innerHTML = "";
    document.body.appendChild(element);
  }

  function Update() {
    if (!getElementRoot) return;
    document.body.innerHTML = "";
    Object.keys(Hooks).map((key) => {
      window[key] = Hooks[key];
    });
    document.body.appendChild(getElementRoot());
    console.log(Effects);
    for (const key in Effects) {
      const { callback, deps } = Effects[key];
      const hasChanged =
        deps &&
        deps.filter(({ dep, value }, i) => value && Hooks[dep] != value).length;
      if (hasChanged || !Effects[key]) {
        deps.map(({ dep, value }, i) => {
          if (value && Hooks[dep] != value) {
            Effects[key].deps[dep] = Hooks[dep];
          }
        });
        callback();
      }
    }
  }
}
