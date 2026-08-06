interface SendResetPasswordEmailPayload {
  to: string;
  resetUrl: string;
}

const resendApiKey = process.env.RESEND_API_KEY;
const resetPasswordFromEmail =
  process.env.RESET_PASSWORD_FROM_EMAIL || "Taxi Collectif <onboarding@resend.dev>";

export async function sendResetPasswordEmail({
  to,
  resetUrl,
}: SendResetPasswordEmailPayload): Promise<void> {
  if (!resendApiKey) {
    console.info(
      `Password reset email for ${to}: ${resetUrl}`
    );
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: resetPasswordFromEmail,
      to,
      subject: "Reset your Taxi Collectif password",
      html: `
        <p>Hello,</p>
        <p>Use the link below to reset your Taxi Collectif password.</p>
        <p><a href="${resetUrl}">Reset password</a></p>
        <p>This link expires in 1 hour. If you did not request this, you can ignore this email.</p>
      `,
    }),
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(`RESET_EMAIL_FAILED: ${details}`);
  }
}
