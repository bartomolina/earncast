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
import { constants } from "ethers";

// Uncomment to use Edge Runtime.
// export const config = {
//   runtime: 'edge',
// }

const campaignImage = (
  title: string,
  subtitle: string,
  description: string,
  tx: string
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

app.transaction("/approve", (c) => {
  const { inputText } = c;

  return c.contract({
    abi,
    chainId: "eip155:84532",
    functionName: "approve",
    args: ["0xb65D9CA12eC91694FE0C4E7390d26e2b42cc3180", parseEther(inputText)],
    to: "0xf38e414F34cF01999fB56d02584B44aa348aE9dc",
  });
});

app.frame("/", (c) => {
  const { buttonValue, inputText, status, deriveState, transactionId } = c;
  const state = deriveState((previousState) => {
    if (transactionId) {
      previousState.tx = transactionId;
      previousState.pageIndex = 1;
    }
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
          <Button.Transaction target="/approve">Approve</Button.Transaction>,
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

app.frame("/ads", (c) => {
  const { buttonValue, inputText, status, deriveState } = c;
  const state = deriveState((previousState) => {
    if (buttonValue === "dashboard") previousState.pageIndex = 1;
    if (buttonValue === "validated") previousState.pageIndex = 2;
  });
  console.log("state: ", state);
  console.log("status: ", status);

  switch (state.pageIndex) {
    case 0:
      return c.res({
        image: campaignImage(
          "🤑 Get paid watching ads",
          "",
          "start watching ads, claim your rewards"
        ),
        intents: [
          <Button value="dashboard">Dashboard</Button>,
          <Button action="/generate-captcha">View Ads</Button>,
        ],
      });
    case 1:
      return c.res({
        image: campaignImage("Dashboard", "", ""),
        intents: [
          <Button.Redirect location="https://superfluid.finance">
            Superfluid
          </Button.Redirect>,
        ],
      });
    case 2:
      return c.res({
        image: campaignImage(
          "Come to the 6th Edition of the CryptoPlaza Forum",
          "",
          "Must follow @cryptoplaza @earncast. Must recast this frame"
        ),
        intents: [
          <Button value="submit">Claim rewards</Button>,
          <Button value="submit">⏭️</Button>,
        ],
      });
  }
});

app.frame("/generate-captcha", async (c) => {
  const { deriveState } = c ?? {};
  const { data, state, image } = await generateCaptchaChallenge();
  // The 2 numbers generated can be used to generate custom Frame image
  const { numA, numB } = data ?? {};
  deriveState((previousState) => {
    // Store `state` data into Frames state
    previousState.captchaId = state.captchaId;
    previousState.valueHash = state.valueHash;
  });
  return c.res({
    image, // Use template Frame image
    intents: [
      <TextInput placeholder="Type Here!" />,
      <Button action="/verify-captcha">Verify</Button>,
    ],
  });
});

app.frame("/verify-captcha", async (c) => {
  const { inputText, deriveState } = c ?? {};
  const state = deriveState() ?? {};
  const { isValidated, image } = await validateCaptchaChallenge({
    inputText,
    state,
  });
  deriveState((previousState) => {
    // Clear Frames state
    previousState.captchaId = "";
    previousState.valueHash = "";
  });
  return c.res({
    image,
    intents: [
      <Button
        value="validated"
        action={isValidated ? "/ads" : "/generate-captcha"}
      >
        {isValidated ? "Continue" : "Try Again?"}
      </Button>,
    ],
  });
});

// @ts-ignore
const isEdgeFunction = typeof EdgeFunction !== "undefined";
const isProduction = isEdgeFunction || import.meta.env?.MODE !== "development";
devtools(app, isProduction ? { assetsPath: "/.frog" } : { serveStatic });

export const GET = handle(app);
export const POST = handle(app);
