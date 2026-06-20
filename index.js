if (typeof global.MessageQueue === "undefined") {
  global.MessageQueue = {
    spy: () => {},
  };
}

require("expo-router/entry");
