methods = {
  async testrt(test){
    console.log(test)
    return {}
  }
}

"client";

//@use("components/button", "components/layout");

StyleSheet(`
    body{
      background:red
    }
    button{
      border:none
    }
`);

@Hook test = "HEHE";
@Hook haha = "hello world";

Effect(() => {
  console.log("test has changed", test);
}, ["test"]);

async function onClick() {
  return Render("/test");
}

function onClick2() {
  testrt("yrdy")
  Hook("haha", haha == "hello world" ? "Hook has toggled" : "hello world");
}

Render(() => {
  return Element("main", {}, [
    Element("div", {
      style: {
        width: "100px",
        height: "100px",
        background: "black",
      },
    }),
    Element("button", { onClick }, test),
    Element("button", { onclick: onClick2 }, haha),
  ]);
});
