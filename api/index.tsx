import { Button, Frog, TextInput } from "@airstack/frog";
import { devtools } from "@airstack/frog/dev";
import { serveStatic } from "@airstack/frog/serve-static";
// import { neynar } from 'frog/hubs'
import { handle } from "@airstack/frog/vercel";
import {
  generateCaptchaChallenge,
  validateCaptchaChallenge,
} from "@airstack/frog";

// Uncomment to use Edge Runtime.
// export const config = {
//   runtime: 'edge',
// }

const campaignFrameJSX = (
  title: string,
  subtitle: string,
  description: string
) => (
  <div
    style={{
      alignItems: "center",
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
  },
  // Supply a Hub to enable frame verification.
  // hub: neynar({ apiKey: 'NEYNAR_FROG_FM' })
});

app.frame("/", (c) => {
  const { buttonValue, inputText, status } = c;
  return c.res({
    image: campaignFrameJSX(
      "Create new Campaign",
      "Amount in $DEGEN",
      "enter the total amount you want to distribute"
    ),
    intents: [
      <TextInput placeholder="$DEGEN amount" />,
      <Button value="next" action="/generate-captcha">
        Next
      </Button>,
      status === "response" && <Button.Reset>Reset</Button.Reset>,
    ],
  });
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
      <Button action={isValidated ? "/test" : "/generate-captcha"}>
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
