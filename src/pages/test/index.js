@client_uses: ["components/button", "components/layout"];
@server_uses: ["database", "methods"];

/* methods = {
  ...global_methods,
}; */

"client";

StyleSheet(`
    body{
      background:blue
    }
    button{
      border:none
    }
`);
@Hook test = "HEHE";
function onClick() {
  Render("/");
}

Render(() => {
  return Element("main", {}, [Element("button", { onClick }, test)]);
});
