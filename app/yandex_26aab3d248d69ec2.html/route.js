const VERIFICATION_UIN = "26aab3d248d69ec2";

export function GET() {
  return new Response(
    `<!doctype html>
<html>
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
</head>
<body>Verification: ${VERIFICATION_UIN}</body>
</html>
`,
    {
      headers: {
        "Content-Type": "text/html; charset=UTF-8",
        "Cache-Control": "public, max-age=300"
      }
    }
  );
}
