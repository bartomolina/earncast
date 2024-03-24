import { Button, Frog, TextInput, parseEther } from "@airstack/frog";
import { devtools } from "@airstack/frog/dev";
import { serveStatic } from "@airstack/frog/serve-static";
// import { neynar } from 'frog/hubs'
import { handle } from "@airstack/frog/vercel";
import {
  generateCaptchaChallenge,
  validateCaptchaChallenge,
} from "@airstack/frog";
import { abi } from "./abi.js";

export const app = new Frog({
  apiKey: process.env.AIRSTACK_API_KEY as string,
  assetsPath: "/",
  basePath: "/api",
  initialState: {
    captchaId: "",
    valueHash: "",
    pageIndex: 0,
  },
  // Supply a Hub to enable frame verification.
  // hub: neynar({ apiKey: 'NEYNAR_FROG_FM' })
});

app.frame("/", (c) => {
  return c.res({
    action: "/finish",
    image: (
      <div style={{ color: "white", display: "flex", fontSize: 60 }}>
        Perform a transaction
      </div>
    ),
    intents: [
      <TextInput placeholder="Value (ETH)" />,
      <Button.Transaction target="/send-ether">Send Ether</Button.Transaction>,
      <Button.Transaction target="/mint">Mint</Button.Transaction>,
    ],
  });
});

app.frame("/finish", (c) => {
  const { transactionId } = c;
  return c.res({
    image: (
      <div style={{ color: "white", display: "flex", fontSize: 60 }}>
        Transaction ID: {transactionId}
      </div>
    ),
  });
});

app.transaction("/send-ether", (c) => {
  const { inputText } = c;
  // Send transaction response.
  return c.send({
    chainId: "eip155:84532",
    to: "0xd2135CfB216b74109775236E36d4b433F1DF507B",
    value: 10n,
  });
});

app.transaction("/mint", (c) => {
  const { inputText } = c;
  // Contract transaction response.
  return c.contract({
    abi,
    chainId: "eip155:10",
    functionName: "mint",
    args: [69420n],
    to: "0xd2135CfB216b74109775236E36d4b433F1DF507B",
    value: parseEther(inputText),
  });
});

// @ts-ignore
const isEdgeFunction = typeof EdgeFunction !== "undefined";
const isProduction = isEdgeFunction || import.meta.env?.MODE !== "development";
devtools(app, isProduction ? { assetsPath: "/.frog" } : { serveStatic });

export const GET = handle(app);
export const POST = handle(app);
