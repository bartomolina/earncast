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

// Uncomment to use Edge Runtime.
// export const config = {
//   runtime: 'edge',
// }

const campaignImage = (
  title: string,
  subtitle: string,
  description: string
) => (
  <div
    style={{
      background: "linear-gradient(to right, #432889, #17101F)",
      backgroundSize: "100% 100%",
      display: "flex",
      flexDirection: "column",
      flexWrap: "nowrap",
      height: "100%",
      justifyContent: "center",
      textAlign: "center",
      width: "100%",
    }}
  >
    <div
      style={{
        color: "white",
        fontSize: 60,
        fontStyle: "normal",
        letterSpacing: "-0.025em",
        lineHeight: 1.4,
        marginTop: 30,
        padding: "0 120px",
        whiteSpace: "pre-wrap",
      }}
    >
      {title}
    </div>
    <div
      style={{
        color: "white",
        fontSize: 50,
        fontStyle: "normal",
        letterSpacing: "-0.025em",
        lineHeight: 1.4,
        marginTop: 30,
        padding: "0 120px",
        whiteSpace: "pre-wrap",
      }}
    >
      {subtitle}
    </div>
    <div
      style={{
        color: "white",
        fontSize: 40,
        fontStyle: "normal",
        letterSpacing: "-0.025em",
        lineHeight: 1.4,
        marginTop: 30,
        padding: "0 120px",
        whiteSpace: "pre-wrap",
      }}
    >
      {description}
    </div>
  </div>
);

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

app.frame("/campaign", (c) => {
  const { buttonValue, inputText, status, deriveState } = c;
  const state = deriveState((previousState) => {
    if (buttonValue === "approve") previousState.pageIndex = 1;
    if (buttonValue === "submit") previousState.pageIndex = 2;
  });
  console.log("state: ", state);
  console.log("status: ", status);

  switch (state.pageIndex) {
    case 0:
      return c.res({
        image: campaignImage(
          "🚀 Create new Campaign",
          "Amount in $DEGEN",
          "enter the total amount you want to distribute"
        ),
        intents: [
          <TextInput placeholder="$DEGEN amount" />,
          <Button.Transaction target="/approve" action="/campaign">
            Approve
          </Button.Transaction>,
          <Button.Transaction target="/send-ether" action="/campaign">
            Send tx
          </Button.Transaction>,
        ],
      });
    case 1:
      return c.res({
        image: campaignImage(
          "🚀 Create new Campaign",
          "Message",
          "enter the text you want to be displayed on the campaign"
        ),
        intents: [
          <TextInput placeholder="Message" />,
          <Button value="submit">Submit</Button>,
        ],
      });
    case 2:
      return c.res({
        image: campaignImage(
          "🎉 New campaign successfully created",
          "",
          "Everyone who follows this account and @earncast will get a $DEGEN stream just by watching the ad."
        ),
        intents: [
          <Button.Redirect location="https://pinata.cloud">
            Track analytics
          </Button.Redirect>,
        ],
      });
  }
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
    value: parseEther(".000000000000000012"),
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
